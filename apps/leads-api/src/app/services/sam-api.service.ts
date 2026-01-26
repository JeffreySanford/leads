import { Injectable } from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';

interface ErrorWithResponse extends Error {
  response?: string;
}

interface SamApiResponse {
  opportunitiesData?: Record<string, unknown>[];
}

@Injectable()
export class SamApiService {
  private readonly SAM_API_BASE = 'https://api.sam.gov/opportunities/v2/search';

  searchContracts(params: {
    naicsCode?: string;
    maxValue?: number;
    setAside?: string;
    limit?: number;
    offset?: number;
    disableNaics?: boolean;
  }): Observable<Record<string, unknown>[]> {
    // SAM.gov requires dates in MM/dd/yyyy format
    const postedFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const postedToDate = new Date();
    
    const formatDate = (date: Date): string => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const searchParams = new URLSearchParams({
      api_key: process.env['SAM_API_KEY'] || 'DEMO_KEY',
      postedFrom: formatDate(postedFromDate),
      postedTo: formatDate(postedToDate),
      limit: (params.limit || 100).toString(),
      offset: (params.offset || 0).toString(),
    });

    if (!params.disableNaics && params.naicsCode) {
      searchParams.append('ncode', params.naicsCode);
    }

    if (params.setAside) {
      searchParams.append('typeOfSetAside', params.setAside);
    }

    const apiUrl = `${this.SAM_API_BASE}?${searchParams.toString()}`;
    
    // Sanitize URL for logging (hide API key)
    const sanitizedUrl = apiUrl.replace(/api_key=[^&]*/, 'api_key=REDACTED');
    
    console.log('🌐 SAM.gov API Request:', {
      url: sanitizedUrl,
      params: {
        naicsCode: params.naicsCode || 'ALL',
        maxValue: params.maxValue || 'NO LIMIT',
        setAside: params.setAside || 'NONE',
        limit: params.limit || 100,
        offset: params.offset || 0,
        disableNaics: params.disableNaics || false,
        dateRange: `${searchParams.get('postedFrom')} to ${searchParams.get('postedTo')}`,
      },
      usingApiKey: process.env['SAM_API_KEY'] ? 'CUSTOM KEY' : 'DEMO_KEY',
    });

    return from(fetch(apiUrl)).pipe(
      tap((response) => 
        console.log('📡 SAM.gov API Response Status:', response.status, response.statusText)
      ),
      switchMap((response) => {
        if (!response.ok) {
          return from(response.text()).pipe(
            switchMap((errorText) => {
              console.error('❌ SAM.gov API Error Response:', errorText);
              const error = new Error(`SAM.gov API returned ${response.status}: ${response.statusText}`) as ErrorWithResponse;
              error.response = errorText;
              return throwError(() => error);
            })
          );
        }
        return from(response.json() as Promise<SamApiResponse>);
      }),
      map((data) => {
        const opportunities = data.opportunitiesData || [];
        console.log('📦 SAM.gov Raw Response:', {
          totalRecords: opportunities.length,
          hasData: !!data.opportunitiesData,
        });
        return opportunities;
      }),
      map((opportunities) => {
        if (!params.maxValue) return opportunities;
        
        const beforeCount = opportunities.length;
        const filtered = opportunities.filter((opp) => {
          const value = this.extractContractValue(opp as Record<string, unknown>);
          return value && value <= (params.maxValue || 0);
        });
        console.log(`💰 After $${params.maxValue} filter: ${filtered.length} of ${beforeCount} opportunities`);
        return filtered;
      }),
      tap((opportunities) => {
        // Write live data to live-seed.ts
        try {
          const fs = require('fs');
          const path = require('path');
          const seedPath = path.resolve(__dirname, '../seed-data/live-seed.ts');
          const fileContent = `// Auto-generated live SAM.gov data\nexport const liveSeedLeads = ${JSON.stringify(opportunities, null, 2)};\n`;
          fs.writeFileSync(seedPath, fileContent, 'utf8');
          console.log('🟢 Live SAM.gov data written to live-seed.ts');
        } catch (err) {
          console.error('⚠️ Could not write live data to live-seed.ts:', err);
        }
      }),
      tap((opportunities) => 
        console.log('✅ Returning', opportunities.length, 'opportunities from SAM.gov')
      ),
      catchError((error) => {
        console.error('❌ SAM.gov API Error:', error.message);
        console.warn('⚠️  SAM.gov API unavailable - no fallback data');
        return throwError(() => error);
      })
    );
  }

  private extractContractValue(opportunity: {
    award?: { amount?: string };
    estimatedValue?: string;
    baseAndAllOptionsValue?: string;
  }): number | null {
    const value =
      opportunity.award?.amount ||
      opportunity.estimatedValue ||
      opportunity.baseAndAllOptionsValue ||
      null;

    return value ? parseFloat(value) : null;
  }


}
