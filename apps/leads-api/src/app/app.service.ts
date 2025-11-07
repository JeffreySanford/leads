import { Injectable } from '@nestjs/common';
import { LeadsService } from './services/leads.service';
import { SamApiService } from './services/sam-api.service';

@Injectable()
export class AppService {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly samApiService: SamApiService
  ) {}

  getData(): { message: string } {
    return { message: 'SAM Leads API - Connected to in-memory MongoDB' };
  }

  async packLeads() {
    const leads = await this.leadsService.packLeads();
    return {
      leads,
      scriptOutput: `Packed ${leads.length} leads from database`,
    };
  }

  async probeSam(leadId: string) {
    return this.leadsService.probeSam(leadId);
  }

  async probeSamVerbose(leadId: string) {
    return this.leadsService.probeSamVerbose(leadId);
  }

  async searchSam(term: string) {
    const searchResult = await this.leadsService.searchSam(term);
    return {
      results: searchResult.leads.map(
        (lead) =>
          `${lead.companyName} (${lead.leadId}) - ${lead.naicsCode}: ${lead.city}, ${lead.stateCode}`
      ),
      total: searchResult.total,
      leads: searchResult.leads,
    };
  }

  async testLiveSamApi() {
    console.log('🔴 Testing LIVE SAM.gov API connection...');
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
      contracts: contracts.map((contract: Record<string, unknown>) => ({
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
