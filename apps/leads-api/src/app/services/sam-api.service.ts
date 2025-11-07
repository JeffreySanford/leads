import { Injectable } from '@nestjs/common';

@Injectable()
export class SamApiService {
  private readonly SAM_API_BASE = 'https://api.sam.gov/opportunities/v2/search';

  async searchContracts(params: {
    naicsCode?: string;
    maxValue?: number;
    setAside?: string;
    limit?: number;
  }) {
    try {
      const searchParams = new URLSearchParams({
        api_key: process.env.SAM_API_KEY || 'DEMO_KEY',
        postedFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        postedTo: new Date().toISOString().split('T')[0],
        limit: (params.limit || 10).toString(),
        offset: '0',
      });

      if (params.naicsCode) {
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
          limit: params.limit || 10,
          dateRange: `${searchParams.get('postedFrom')} to ${searchParams.get(
            'postedTo'
          )}`,
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
        throw new Error(
          `SAM.gov API returned ${response.status}: ${response.statusText}`
        );
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

      console.log(
        '✅ Returning',
        opportunities.length,
        'opportunities from SAM.gov'
      );
      return opportunities;
    } catch (error) {
      const err = error as Error;
      console.error('❌ SAM.gov API Error:', err.message);
      console.warn('⚠️  Falling back to MOCK data');
      return this.getMockSamData();
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

  private getMockSamData() {
    // Fallback mock data that looks like real SAM.gov response
    return [
      {
        noticeId: 'SAM-MOCK-2024-001',
        title: 'Small Business IT Support Services',
        solicitationNumber: 'W912DY24R0123',
        fullParentPathName:
          'DEPT OF DEFENSE.DEPT OF THE ARMY.US ARMY CORPS OF ENGINEERS',
        type: 'Solicitation',
        typeOfSetAsideDescription: 'Total Small Business Set-Aside (FAR 19.5)',
        typeOfSetAside: 'SBA',
        baseAndAllOptionsValue: '225000',
        naicsCode: '541512',
        description:
          'TEST DATA from SAM.gov API (using mock due to API key): IT support services for small Army installation. Includes help desk, server maintenance, network administration. Small Business Set-Aside opportunity under $250K. This would be a real contract if API key was configured.',
        postedDate: new Date().toISOString(),
        responseDeadLine: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        organizationType: 'OFFICE',
        officeAddress: {
          city: 'Washington',
          state: 'DC',
        },
        pointOfContact: [
          {
            type: 'primary',
            fullName: 'Contract Specialist',
            email: 'contracts@army.mil',
          },
        ],
        links: [
          {
            rel: 'self',
            href: 'https://sam.gov/opp/SAM-MOCK-2024-001/view',
          },
        ],
      },
    ];
  }
}
