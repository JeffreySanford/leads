import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LeadResponseDto {
  leadId: string;
  companyName: string;
  naicsCode: string;
  naicsDescription?: string;
  city: string;
  stateCode: string;
  businessType?: string[];
  registrationStatus: string;
  contracts?: {
    contractNumber: string;
    title: string;
    description?: string;
    value: number;
    awardDate: Date;
    status: string;
    sampleData?: boolean;
    isSample?: boolean;
    isTest?: boolean;
  }[];
}

@Component({
  selector: 'app-search-sam',
  templateUrl: './search-sam.component.html',
  styleUrls: ['./search-sam.component.scss'],
  standalone: false,
})
export class SearchSamComponent {
  debugInfo = '';

  private http = inject(HttpClient);
  get filteredLeads(): LeadResponseDto[] {
    if (this.showSampleData) {
      // Show all leads including sample data
      return this.leads;
    }
    // Hide sample data - filter out leads AND their sample contracts
    return this.leads
      .map((lead) => {
        // Filter out sample contracts from each lead
        const nonSampleContracts =
          lead.contracts?.filter((c) => !c.isSample) || [];
        // Only include leads that have at least one non-sample contract
        if (nonSampleContracts.length > 0) {
          return {
            ...lead,
            contracts: nonSampleContracts,
          };
        }
        return null;
      })
      .filter((lead) => lead !== null) as LeadResponseDto[];
  }
  mathCeil(value: number): number {
    return Math.ceil(value);
  }
  term = '';
  naicsCode = '';
  leads: LeadResponseDto[] = [];
  searchTotal = 0;
  loading = false;
  hasRun = false;
  expandedLeads = new Set<string>();
  showNaicsCodes = true; // Toggle for NAICS code display
  showSampleData = true; // Toggle for sample data display
  disableNaics = false; // Toggle for NAICS filter
  limit = 100;
  offset = 0;

  // Common NAICS codes for quick selection
  commonNaicsCodes = [
    { code: '541512', description: 'Computer Systems Design Services' },
    { code: '541511', description: 'Custom Computer Programming Services' },
    { code: '541513', description: 'Computer Facilities Management Services' },
    { code: '541519', description: 'Other Computer Related Services' },
    { code: '541690', description: 'Other Scientific and Technical Consulting' },
    { code: '541611', description: 'Administrative Management and General Management' }
  ];


  get sampleCount(): number {
    // Count total number of sample contracts across all leads
    return this.leads.reduce((count, lead) => {
      const sampleContracts = lead.contracts?.filter((c) => c.isSample || c.sampleData) || [];
      return count + sampleContracts.length;
    }, 0);
  }

  get realCount(): number {
    return this.leads.filter(
      (lead) =>
        lead.contracts && lead.contracts.some((c) => !c.isSample && !c.sampleData && !c.isTest)
    ).length;
  }

  get testCount(): number {
    return this.leads.filter(
      (lead) => lead.contracts && lead.contracts.some((c) => c.isTest)
    ).length;
  }

  get selectedNaicsCodes(): string[] {
    return this.naicsCode.split(',').map(c => c.trim()).filter(c => c);
  }

  addNaicsCode(code: string): void {
    const currentCodes = this.selectedNaicsCodes;
    if (currentCodes.includes(code)) {
      // Remove if already selected
      this.removeNaicsCode(code);
    } else {
      // Add if not selected
      currentCodes.push(code);
      this.naicsCode = currentCodes.join(', ');
    }
  }

  removeNaicsCode(code: string): void {
    const currentCodes = this.selectedNaicsCodes;
    const index = currentCodes.indexOf(code);
    if (index > -1) {
      currentCodes.splice(index, 1);
      this.naicsCode = currentCodes.join(', ');
    }
  }

  toggleNaicsCode(code: string): void {
    const currentCodes = this.selectedNaicsCodes;
    const index = currentCodes.indexOf(code);
    if (index > -1) {
      // Remove the code
      currentCodes.splice(index, 1);
    } else {
      // Add the code
      currentCodes.push(code);
    }
    this.naicsCode = currentCodes.join(', ');
  }

  isNaicsCodeSelected(code: string): boolean {
    return this.selectedNaicsCodes.includes(code);
  }

  getNaicsName(code: string): string {
    const naics = this.commonNaicsCodes.find(n => n.code === code);
    return naics ? naics.description : code;
  }

  hasSampleContracts(lead: LeadResponseDto): boolean {
    return lead.contracts?.some((c) => c.isSample || c.sampleData) || false;
  }

  hasRealContracts(lead: LeadResponseDto): boolean {
    return lead.contracts?.some((c) => !c.isSample && !c.sampleData && !c.isTest) || false;
  }

  formatValue(value: number): string {
    return value.toLocaleString();
  }

  calculateTotalValue(contracts: LeadResponseDto['contracts']): string {
    const total = contracts?.reduce((sum, contract) => sum + (contract?.value || 0), 0) || 0;
    return total.toLocaleString();
  }

  toggleExpand(leadId: string): void {
    if (this.expandedLeads.has(leadId)) {
      this.expandedLeads.delete(leadId);
    } else {
      this.expandedLeads.add(leadId);
    }
  }

  isExpanded(leadId: string): boolean {
    return this.expandedLeads.has(leadId);
  }

  search() {
    this.loading = true;
    this.hasRun = true;
    this.leads = [];
    this.searchTotal = 0;
    this.http
      .post<{ results: string[]; total: number; leads: LeadResponseDto[] }>(
        '/api/search',
        {
          term: this.term,
          naicsCode: this.naicsCode,
          disableNaics: this.disableNaics,
          limit: this.limit,
          offset: this.offset
        }
      )
      .subscribe({
        next: (data) => {
          this.leads = data.leads || [];
          this.searchTotal = data.total || 0;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error searching SAM:', err);
          this.loading = false;
        },
      });
  }

  searchSamGov() {
    this.loading = true;
    console.log('🔍 Searching SAM.gov live with parameters:', {
      naicsCode: this.naicsCode || 'ALL',
      maxValue: 250000,
      limit: 10
    });

    this.http
      .post<{
        success: boolean;
        message: string;
        contractsFound: number;
        contracts: Record<string, unknown>[];
        timestamp: Date;
      }>(
        '/api/search-sam-gov',
        {
          naicsCode: this.naicsCode || undefined,
          maxValue: 250000,
          limit: 10
        }
      )
      .subscribe({
        next: (data) => {
          this.loading = false;
          if (data.success) {
            console.log(`✅ ${data.message}`);
            if (data.contractsFound === 0) {
              console.log('❌ No contracts found matching the search criteria');
            }
            // The detailed logging is done in the backend
          } else {
            console.error('❌ SAM.gov search failed:', data.message);
          }
        },
        error: (err) => {
          console.error('❌ Error searching SAM.gov:', err);
          this.loading = false;
        },
      });
  }

  showAllOpportunities() {
    this.disableNaics = true;
    this.offset = 0;
    this.search();
  }

  nextPage() {
    this.offset += this.limit;
    this.search();
  }

  prevPage() {
    if (this.offset >= this.limit) {
      this.offset -= this.limit;
      this.search();
    }
  }
}
