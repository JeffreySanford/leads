import { Injectable } from '@nestjs/common';

@Injectable()
export class SamApiService {
  private readonly SAM_API_BASE = 'https://api.sam.gov/opportunities/v2/search';

  async searchContracts(params: {
    naicsCode?: string;
    maxValue?: number;
    setAside?: string;
    limit?: number;
    offset?: number;
    disableNaics?: boolean;
  }) {
    try {
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
        api_key: process.env.SAM_API_KEY || 'DEMO_KEY',
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
      console.log('🌐 SAM.gov API Request:', {
        url: apiUrl,
        params: {
          naicsCode: params.naicsCode || 'ALL',
          maxValue: params.maxValue || 'NO LIMIT',
          setAside: params.setAside || 'NONE',
          limit: params.limit || 100,
          offset: params.offset || 0,
          disableNaics: params.disableNaics || false,
          dateRange: `${searchParams.get('postedFrom')} to ${searchParams.get('postedTo')}`,
        },
        usingApiKey: process.env.SAM_API_KEY ? 'CUSTOM KEY' : 'DEMO_KEY',
      });

      const response = await fetch(apiUrl);
      console.log(
        '📡 SAM.gov API Response Status:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SAM.gov API Error Response:', errorText);
        const error = new Error(
          `SAM.gov API returned ${response.status}: ${response.statusText}`
        );
        (error as any).response = errorText;
        throw error;
      }

      const data = (await response.json()) as {
        opportunitiesData?: Record<string, unknown>[];
      };
      console.log('📦 SAM.gov Raw Response:', {
        totalRecords: data.opportunitiesData?.length || 0,
        hasData: !!data.opportunitiesData,
      });

      let opportunities = data.opportunitiesData || [];
      console.log(
        '🔍 Before value filter:',
        opportunities.length,
        'opportunities'
      );

      if (params.maxValue) {
        const beforeCount = opportunities.length;
        opportunities = opportunities.filter((opp) => {
          const value = this.extractContractValue(
            opp as {
              award?: { amount?: string };
              estimatedValue?: string;
              baseAndAllOptionsValue?: string;
            }
          );
          return value && value <= (params.maxValue || 0);
        });
        console.log(
          `💰 After $${params.maxValue} filter: ${opportunities.length} of ${beforeCount} opportunities`
        );
      }

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

      console.log(
        '✅ Returning',
        opportunities.length,
        'opportunities from SAM.gov'
      );
      return opportunities;
    } catch (error) {
      const err = error as Error;
      console.error('❌ SAM.gov API Error:', err.message);
      console.warn('⚠️  SAM.gov API unavailable - no fallback data');
      // Throw the error instead of returning empty array
      throw error;
    }
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
