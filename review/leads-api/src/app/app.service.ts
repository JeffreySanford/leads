import { Injectable } from '@nestjs/common';

interface Lead {
  lead_id: number;
  company: string;
  naics_code: string;
}

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  packLeads(): { leads: Lead[] } {
    // Mock packed leads data
    return {
      leads: [
        { lead_id: 1001, company: 'Acme Corp', naics_code: '541611' },
        { lead_id: 1002, company: 'Globex Inc', naics_code: '541512' },
        { lead_id: 1003, company: 'Initech', naics_code: '541513' },
      ],
    };
  }

  probeSam(leadId: string): { result: string } {
    return { result: `Probing SAM for lead: ${leadId}. Result: [sample output]` };
  }

  probeSamVerbose(leadId: string): { result: string } {
    return { result: `Verbose probing SAM for lead: ${leadId}. Detailed result: [sample verbose output]` };
  }

  searchSam(term: string): { results: string[] } {
    return { results: [`Search results for ${term}: [sample results]`] };
  }
}
