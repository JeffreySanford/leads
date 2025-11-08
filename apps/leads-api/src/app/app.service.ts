import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LeadResponseDto } from './dto/lead.dto';
import { LeadsService } from './services/leads.service';
import { SamApiService } from './services/sam-api.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

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

  getData(): { message: string } {
    return { message: 'SAM Leads API - Connected to in-memory MongoDB' };
  }

  async getHealthStatus() {
    const dbConnected = this.mongoConnection.readyState === 1;
    
    // Only check SAM API status if explicitly requested elsewhere

    return {
      status: 'ok',
      database: {
        connected: dbConnected,
        status: dbConnected ? 'online' : 'offline',
      },
      samApi: {
        connected: this.samApiStatus === 'connected',
        status: this.samApiStatus,
        lastCheck: this.lastSamApiCheck,
      },
      timestamp: new Date().toISOString(),
    };
  }


  async packLeads() {
    const leads = await firstValueFrom(this.leadsService.packLeads());
    return {
      leads,
      scriptOutput: `Packed ${leads.length} leads from database`,
    };
  }

  probeSam(leadId: string) {
    return this.leadsService.probeSam(leadId);
  }

  probeSamVerbose(leadId: string) {
    return this.leadsService.probeSamVerbose(leadId);
  }

  async searchSam(term: string) {
    const searchResult = await firstValueFrom(this.leadsService.searchSam(term));
    return {
      results: searchResult.leads.map(
        (lead: LeadResponseDto) =>
          `${lead.companyName} (${lead.leadId}) - ${lead.naicsCode}: ${lead.city}, ${lead.stateCode}`
      ),
      total: searchResult.total,
      leads: searchResult.leads,
    };
  }

  async testLiveSamApi() {
    console.log('🔴 Testing LIVE SAM.gov API connection...');
    try {
      const contracts = await this.samApiService.searchContracts({
        maxValue: 250000,
        setAside: 'SBA', // Small Business Set-Aside
        limit: 5,
      });
      return {
        success: true,
        message:
          'SAM.gov API Test - Fetching real contracts under $250K with Small Business Set-Aside',
        contractsFound: contracts.length,
        contracts: contracts.map((contract: Record<string, any>) => ({
          leadId: contract.noticeId,
          companyName: contract.title,
          naicsCode: contract.naicsCode,
          naicsDescription: contract.typeOfSetAsideDescription,
          city: '',
          stateCode: '',
          businessType: [],
          registrationStatus: contract.type,
          probeStatus: 'live',
          lastProbed: contract.postedDate ? new Date(contract.postedDate) : undefined,
          contracts: [
            {
              contractNumber: contract.solicitationNumber,
              title: contract.title,
              description: contract.agency,
              value: Number(contract.baseAndAllOptionsValue) || 0,
              awardDate: contract.postedDate ? new Date(contract.postedDate) : new Date(),
              status: 'Active',
              isSample: false,
              isTest: false,
            },
          ],
        })),
        timestamp: new Date(),
      };
    } catch (error: unknown) {
      // Show rate limit details if available
      let errorMsg = 'SAM.gov API error.';
      let quotaMsg = '';
  if (typeof error === 'object' && error !== null && 'message' in error) {
        const err = error as { message: string; response?: unknown };
        if (err.message.includes('429')) {
          errorMsg = 'SAM.gov API rate limit exceeded (429 Too Many Requests).';
          if (err.response) {
            try {
              const errJson = typeof err.response === 'string' ? JSON.parse(err.response) : err.response;
              quotaMsg = `Quota message: ${errJson.message || ''} Next access: ${errJson.nextAccessTime || ''}`;
            } catch (parseErr) {
              // Could not parse SAM.gov error response
              console.warn('Could not parse SAM.gov error response:', parseErr);
            }
          }
        }
      }
      return {
        success: false,
        message: errorMsg,
        quota: quotaMsg,
        timestamp: new Date(),
      };
    }
  }

  async searchNdItContracts() {
    console.log(
      '🔵 Searching SAM.gov for North Dakota IT-related contracts...'
    );

    // North Dakota IT-related NAICS codes
    const ndItNaicsCodes = [
      '541512', // Computer Systems Design Services
      '541511', // Custom Computer Programming Services
      '541513', // Computer Facilities Management Services
      '541519', // Other Computer Related Services
      '541690', // Other Scientific and Technical Consulting Services (includes cybersecurity)
    ];

    const allContracts: Record<string, unknown>[] = [];

    // Search for each NAICS code
    for (const naicsCode of ndItNaicsCodes) {
      console.log(`  Searching for NAICS ${naicsCode}...`);
      const contracts = await this.samApiService.searchContracts({
        naicsCode,
        maxValue: 250000,
        setAside: 'SBA',
        limit: 10,
      });
      allContracts.push(...contracts);
    }

    // Remove duplicates by noticeId
    const uniqueContracts = Array.from(
      new Map(allContracts.map((c) => [c.noticeId, c])).values()
    );

    console.log(`✅ Found ${uniqueContracts.length} unique ND IT contracts`);

    return {
      success: true,
      message:
        'North Dakota IT Contracts - Under $250K with Small Business Set-Aside',
      contractsFound: uniqueContracts.length,
      naicsCodesSearched: ndItNaicsCodes,
      contracts: uniqueContracts.map((contract: Record<string, unknown>) => ({
        noticeId: contract.noticeId,
        title: contract.title,
        solicitationNumber: contract.solicitationNumber,
        agency: contract.fullParentPathName,
        type: contract.type,
        setAside: contract.typeOfSetAsideDescription,
        value: contract.baseAndAllOptionsValue,
        naicsCode: contract.naicsCode,
        postedDate: contract.postedDate,
        responseDeadLine: contract.responseDeadLine,
        link: (contract.links as { href?: string }[])?.[0]?.href,
      })),
      timestamp: new Date(),
    };
  }
}
