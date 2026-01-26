import { Injectable } from '@nestjs/common';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError, tap, mergeMap, toArray } from 'rxjs/operators';
import { LeadResponseDto, ProbeResultDto } from './dto/lead.dto';
import { LeadsService } from './services/leads.service';
import { SamApiService } from './services/sam-api.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface SamContract {
  noticeId: string;
  title: string;
  naicsCode: string;
  typeOfSetAsideDescription?: string;
  type?: string;
  postedDate?: string;
  solicitationNumber?: string;
  agency?: string;
  fullParentPathName?: string;
  baseAndAllOptionsValue?: string | number;
  responseDeadLine?: string;
  links?: { href?: string }[];
}

export interface HealthStatus {
  status: string;
  database: {
    connected: boolean;
    status: string;
  };
  samApi: {
    connected: boolean;
    status: string;
    lastCheck: Date | null;
  };
  timestamp: string;
}

export interface SamApiTestResult {
  success: boolean;
  message: string;
  contractsFound: number;
  contracts: LeadResponseDto[];
  timestamp: Date;
  quota?: string;
}

export interface NdItSearchResult extends SamApiTestResult {
  naicsCodesSearched: string[];
}

@Injectable()
export class AppService {
  private lastSamApiCheck: Date | null = null;
  private samApiStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

  constructor(
    private readonly leadsService: LeadsService,
    private readonly samApiService: SamApiService,
    @InjectConnection() private readonly mongoConnection: Connection
  ) {
  // Do not check SAM.gov API status on startup. Only check when explicitly requested.
  }

  getData(): Observable<{ message: string }> {
    return of({ message: 'SAM Leads API - Connected to in-memory MongoDB' });
  }

  getHealthStatus(): Observable<HealthStatus> {
    const dbConnected = this.mongoConnection.readyState === 1;
    
    // Determine SAM.gov API status
    // If we've already done a successful check, use that.
    // Otherwise, check if an API key is present.
    let currentStatus = this.samApiStatus;
    if (currentStatus === 'disconnected') {
      const apiKey = process.env['SAM_API_KEY'];
      if (apiKey && apiKey !== 'DEMO_KEY' && apiKey.length > 5) {
        currentStatus = 'connected'; // Assume connected if we have a key
      }
    }

    return of({
      status: 'ok',
      database: {
        connected: dbConnected,
        status: dbConnected ? 'online' : 'offline',
      },
      samApi: {
        connected: currentStatus === 'connected',
        status: currentStatus,
        lastCheck: this.lastSamApiCheck,
      },
      timestamp: new Date().toISOString(),
    });
  }


  packLeads(mode?: string): Observable<{ leads: LeadResponseDto[]; scriptOutput: string }> {
    return this.leadsService.packLeads().pipe(
      map(leads => {
        if (mode === 'live') {
          const filtered = leads.filter(lead =>
            lead.contracts && lead.contracts.every(c => !c.isSample && !c.isTest)
          );
          return {
            leads: filtered,
            scriptOutput: `🌱 Loaded ${filtered.length} live leads (filtered out sample data)`,
          };
        }
        const isSample = leads.length > 0 && leads.every(lead => lead.contracts?.some(c => c.isSample));
        let scriptOutput = isSample ? `🌱 Seeding database with North Dakota SAM.gov leads...` : `${leads.length} records`;
        // If no records for specific NAICS, append zero records message
        const naicsFiltered = leads.filter(lead => lead.naicsCode && lead.contracts && lead.contracts.length > 0);
        if (naicsFiltered.length === 0) {
          scriptOutput += ' | Zero records available for the selected NAICS.';
        }
        return {
          leads,
          scriptOutput,
        };
      })
    );
  }

  probeSam(leadId: string): Observable<ProbeResultDto> {
    return this.leadsService.probeSam(leadId);
  }

  probeSamVerbose(leadId: string): Observable<ProbeResultDto> {
    return this.leadsService.probeSamVerbose(leadId);
  }

  searchSam(term: string, naicsCode?: string): Observable<{ results: string[]; total: number; leads: LeadResponseDto[] }> {
    return this.leadsService.searchSam(term, naicsCode).pipe(
      map(searchResult => ({
        results: searchResult.leads.map(
          (lead: LeadResponseDto) =>
            `${lead.companyName} (${lead.leadId}) - ${lead.naicsCode}: ${lead.city}, ${lead.stateCode}`
        ),
        total: searchResult.total,
        leads: searchResult.leads,
      }))
    );
  }

  testLiveSamApi(): Observable<SamApiTestResult> {
    console.log('🔴 Testing LIVE SAM.gov API connection...');
    return (this.samApiService.searchContracts({
      maxValue: 250000,
      setAside: 'SBA', // Small Business Set-Aside
      limit: 5,
    }) as unknown as Observable<SamContract[]>).pipe(
      tap(() => {
        this.samApiStatus = 'connected';
        this.lastSamApiCheck = new Date();
      }),
      switchMap((contracts) => {
        // Map to LeadResponseDto format
        const leadDtos: LeadResponseDto[] = contracts.map((contract) => ({
          leadId: contract.noticeId,
          companyName: contract.title,
          naicsCode: contract.naicsCode,
          naicsDescription: contract.typeOfSetAsideDescription,
          city: '',
          stateCode: '',
          businessType: [],
          registrationStatus: contract.type || '',
          probeStatus: 'live',
          lastProbed: contract.postedDate ? new Date(contract.postedDate) : undefined,
          contracts: [
            {
              contractNumber: contract.solicitationNumber || '',
              title: contract.title,
              description: contract.agency,
              value: Number(contract.baseAndAllOptionsValue) || 0,
              awardDate: contract.postedDate ? new Date(contract.postedDate) : new Date(),
              status: 'Active',
              isSample: false,
              isTest: false,
            },
          ],
        }));

        // Save to database (avoid duplicates by leadId)
        // Using mergeMap and toArray to handle the loop as an observable stream
        return from(leadDtos).pipe(
          mergeMap(leadDto => from(this.leadsService.saveLeadIfNotExists(leadDto))),
          toArray(),
          map(() => ({
            success: true,
            message: 'SAM.gov API Test - Fetching real contracts under $250K with Small Business Set-Aside',
            contractsFound: contracts.length,
            contracts: leadDtos,
            timestamp: new Date(),
          }))
        );
      }),
      catchError((error) => {
        this.samApiStatus = 'error';
        this.lastSamApiCheck = new Date();
        // Show rate limit details if available
        let errorMsg = 'SAM.gov API error.';
        let quotaMsg = '';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const err = error as { message: string; response?: unknown };
          if (err.message.includes('429')) {
            errorMsg = 'SAM.gov API rate limit exceeded (429 Too Many Requests).';
            if (err.response) {
              try {
                const errJson = typeof err.response === 'string' ? JSON.parse(err.response as string) : err.response;
                quotaMsg = `Quota message: ${errJson.message || ''} Next access: ${errJson.nextAccessTime || ''}`;
              } catch (parseErr) {
                console.warn('Could not parse SAM.gov error response:', parseErr);
              }
            }
          }
        }
        return of({
          success: false,
          message: errorMsg,
          contractsFound: 0,
          contracts: [],
          quota: quotaMsg,
          timestamp: new Date(),
        });
      })
    );
  }

  searchNdItContracts(): Observable<NdItSearchResult> {
    console.log('🔵 Searching SAM.gov for North Dakota IT-related contracts...');

    const ndItNaicsCodes = [
      '541512', '541511', '541513', '541519', '541690'
    ];

    // Search for each NAICS code in parallel
    const searchTasks = ndItNaicsCodes.map(naicsCode => 
      (this.samApiService.searchContracts({
        naicsCode,
        maxValue: 250000,
        setAside: 'SBA',
        limit: 10,
      }) as unknown as Observable<SamContract[]>).pipe(
        tap(() => console.log(`  Received results for NAICS ${naicsCode}...`))
      )
    );

    return forkJoin(searchTasks).pipe(
      tap(() => {
        this.samApiStatus = 'connected';
        this.lastSamApiCheck = new Date();
      }),
      switchMap((resultsArray) => {
        const allContracts = resultsArray.flat();
        
        // Remove duplicates by noticeId
        const uniqueContracts = Array.from(
          new Map(allContracts.map((c) => [c.noticeId, c])).values()
        );

        console.log(`✅ Found ${uniqueContracts.length} unique ND IT contracts`);

        // Map to LeadResponseDto format for saving
        const leadDtos: LeadResponseDto[] = uniqueContracts.map((contract) => ({
          leadId: contract.noticeId,
          companyName: contract.title,
          naicsCode: contract.naicsCode,
          naicsDescription: contract.typeOfSetAsideDescription,
          city: '',
          stateCode: '',
          businessType: [],
          registrationStatus: contract.type || '',
          probeStatus: 'live',
          lastProbed: contract.postedDate ? new Date(contract.postedDate) : undefined,
          contracts: [
            {
              contractNumber: contract.solicitationNumber || '',
              title: contract.title,
              description: contract.fullParentPathName,
              value: Number(contract.baseAndAllOptionsValue) || 0,
              awardDate: contract.postedDate ? new Date(contract.postedDate) : new Date(),
              status: 'Active',
              isSample: false,
              isTest: false,
            },
          ],
        }));

        // Persist to database so they appear in "Live" view
        return from(leadDtos).pipe(
          mergeMap(leadDto => from(this.leadsService.saveLeadIfNotExists(leadDto))),
          toArray(),
          map(() => ({
            success: true,
            message: 'North Dakota IT Contracts - Under $250K with Small Business Set-Aside',
            contractsFound: uniqueContracts.length,
            naicsCodesSearched: ndItNaicsCodes,
            contracts: leadDtos,
            timestamp: new Date(),
          }))
        );
      }),
      catchError((error) => {
        this.samApiStatus = 'error';
        this.lastSamApiCheck = new Date();
        return throwError(() => error);
      })
    );
  }

  searchSamGov(params: {
    naicsCode?: string;
    maxValue?: number;
    limit?: number;
  }): Observable<{
    success: boolean;
    message: string;
    contractsFound: number;
    contracts: SamContract[];
    timestamp: Date;
  }> {
    return (this.samApiService
      .searchContracts({
        naicsCode: params.naicsCode,
        maxValue: params.maxValue || 250000,
        setAside: 'SBA',
        limit: params.limit || 10,
      }) as unknown as Observable<SamContract[]>)
      .pipe(
        map((contracts) => {
          console.log(
            `🔍 SAM.gov Search Results: Found ${contracts.length} contracts`
          );
          return {
            success: true,
            message: `Found ${contracts.length} contracts`,
            contractsFound: contracts.length,
            contracts: contracts,
            timestamp: new Date(),
          };
        }),
        catchError((error) => {
          console.error('Error in searchSamGov:', error);
          return of({
            success: false,
            message: `Error searching SAM.gov: ${error?.toString()}`,
            contractsFound: 0,
            contracts: [],
            timestamp: new Date(),
          });
        })
      );
  }
}
