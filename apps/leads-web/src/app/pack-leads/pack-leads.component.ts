import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StatusService } from '../services/status.service';
import { Subject, takeUntil } from 'rxjs';

interface LeadResponseDto {
  leadId: string;
  companyName: string;
  naicsCode: string;
  naicsDescription?: string;
  city: string;
  stateCode: string;
  businessType?: string[];
  registrationStatus: string;
  probeStatus?: string;
  lastProbed?: Date;
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
  selector: 'app-pack-leads',
  templateUrl: './pack-leads.component.html',
  styleUrls: ['./pack-leads.component.scss'],
  standalone: false,
})
export class PackLeadsComponent implements OnInit, OnDestroy {
  // NAICS code search state
  selectedNaicsCodes: string[] = ['541512', '541519', '541511', '541513', '541690']; // Example default codes
  naicsSearchMode: 'any' | 'all' = 'any';

  private naicsNames: Record<string, string> = {
    '541512': 'Computer Systems Design Services',
    '541511': 'Custom Computer Programming Services',
    '541513': 'Computer Facilities Management Services',
    '541519': 'Other Computer Related Services',
    '541690': 'Other Scientific and Technical Consulting Services (Cybersecurity)',
  };

  getNaicsName(code: string): string {
    return this.naicsNames[code] || code;
  }

  addNaicsCode(code: string): void {
    if (!this.selectedNaicsCodes.includes(code)) {
      this.selectedNaicsCodes.push(code);
      this.triggerNaicsSearch();
    }
  }

  removeNaicsCode(code: string): void {
    const index = this.selectedNaicsCodes.indexOf(code);
    if (index > -1) {
      this.selectedNaicsCodes.splice(index, 1);
      this.triggerNaicsSearch();
    }
  }

  toggleNaicsSearchMode() {
    this.naicsSearchMode = this.naicsSearchMode === 'any' ? 'all' : 'any';
    this.triggerNaicsSearch();
  }

  triggerNaicsSearch() {
    // TODO: Implement search logic using selectedNaicsCodes and naicsSearchMode
    // Example: Call backend API with cumulative NAICS string and mode
    // this.searchLeadsByNaics(this.selectedNaicsCodes, this.naicsSearchMode);
  }
  // SAM.gov API status and latency for footer display
  samApiStatus: 'connected' | 'loading' | 'error' = 'loading';
  samApiLatency: number | null = null;
  showAllNaics = false;

  // Toggle for showing all NAICS connected records
  toggleShowAllNaics() {
    this.showAllNaics = !this.showAllNaics;
    this.pageIndex = 0;
  }

  // Paginated leads for table (first 50 records, 5 per page)
  get paginatedLeads(): LeadResponseDto[] {
    let allLeads: LeadResponseDto[];
    if (this.showAllNaics) {
      // Combine sample and live leads, remove duplicates by leadId
      const sampleLeads = this.leads.filter(l => l.probeStatus !== 'live');
      const liveLeads = this.leads.filter(l => l.probeStatus === 'live');
      const combined = [...sampleLeads, ...liveLeads];
      const unique = Array.from(new Map(combined.map(l => [l.leadId, l])).values());
      allLeads = unique;
    } else {
      allLeads = this.filteredLeads;
    }
    // Sort by awardDate (most recent first)
    allLeads = allLeads.sort((a, b) => {
      const aDate = a.contracts?.[0]?.awardDate ? new Date(a.contracts[0].awardDate).getTime() : 0;
      const bDate = b.contracts?.[0]?.awardDate ? new Date(b.contracts[0].awardDate).getTime() : 0;
      return bDate - aDate;
    });
    // Limit to first 50
    const limited = allLeads.slice(0, 50);
    // Paginate
    const start = this.pageIndex * this.pageSize;
    return limited.slice(start, start + this.pageSize);
  }

  // Totals for status container
  get backendTotal() {
    // Simulate backend total as all leads
    return this.leads.length;
  }
  get backendContractTotal() {
    return this.leads.reduce((sum, l) => sum + (l.contracts?.length || 0), 0);
  }
  get databaseTotal() {
    // Simulate database total as sample leads
    return this.leads.filter(l => l.probeStatus !== 'live').length;
  }
  get databaseContractTotal() {
    return this.leads.filter(l => l.probeStatus !== 'live').reduce((sum, l) => sum + (l.contracts?.length || 0), 0);
  }
  get samTotal() {
    // Simulate SAM.gov total as live leads
    return this.leads.filter(l => l.probeStatus === 'live').length;
  }
  get samContractTotal() {
    return this.leads.filter(l => l.probeStatus === 'live').reduce((sum, l) => sum + (l.contracts?.length || 0), 0);
  }
  // Material table data source for displayed contracts (sample or live based on mode)
  displayedContracts: Array<{
    contractNumber: string;
    title: string;
    description?: string;
    value: number;
    awardDate: Date;
    leadId: string;
    companyName: string;
  }> = [];

  tableFilter = '';
  pageIndex = 0;
  pageSize = 5;

  get filteredDisplayedContracts() {
    let contracts = this.displayedContracts;
    if (this.tableFilter.trim()) {
      const filter = this.tableFilter.trim().toLowerCase();
      contracts = contracts.filter(c =>
        c.contractNumber.toLowerCase().includes(filter) ||
        c.title.toLowerCase().includes(filter) ||
        (c.companyName?.toLowerCase().includes(filter) ?? false)
      );
    }
    const start = this.pageIndex * this.pageSize;
    return contracts.slice(start, start + this.pageSize);
  }

  get filteredDisplayedContractsTotal() {
    let contracts = this.displayedContracts;
    if (this.tableFilter.trim()) {
      const filter = this.tableFilter.trim().toLowerCase();
      contracts = contracts.filter(c =>
        c.contractNumber.toLowerCase().includes(filter) ||
        c.title.toLowerCase().includes(filter) ||
        (c.companyName?.toLowerCase().includes(filter) ?? false)
      );
    }
    return contracts.length;
  }

  updateDisplayedContracts() {
    // When showing sample data, display sample contracts
    // When showing live data, display live contracts (filtering out sample data)
    if (this.showSampleData) {
      this.displayedContracts = (this.filteredLeads ?? []).flatMap(lead =>
        (lead.contracts ?? [])
          .filter(c => c.sampleData || c.isSample)
          .map(c => ({ ...c, leadId: lead.leadId, companyName: lead.companyName }))
      );
    } else {
      // In live mode, show only live contracts (not sample data)
      this.displayedContracts = (this.filteredLeads ?? []).flatMap(lead =>
        (lead.contracts ?? [])
          .filter(c => !c.sampleData && !c.isSample && !c.isTest)
          .map(c => ({ ...c, leadId: lead.leadId, companyName: lead.companyName }))
      );
    }
  }

  onTableFilterChange(value: string) {
    this.tableFilter = value;
    this.pageIndex = 0;
  }

  onTablePageChange(event: { pageIndex: number; pageSize: number }) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  lastApiError: string | null = null;
  lastLatency: number | null = null;
  lastSource: 'sample' | 'live' = 'live';
  showSampleData = false; // Default to LIVE data
  // ...existing code...
  showLabOverlay = false;
  showSampleContracts = true;

  toggleLabOverlay() {
    this.showLabOverlay = !this.showLabOverlay;
    this.showSampleContracts = true;
  }
  constructor() { /* empty */ }
  private cdr = inject(ChangeDetectorRef);


  toggleSampleData() {
    if (this.isSwitching) return;
    const newMode = this.showSampleData ? 'live' : 'test';
    this.statusService.setMode(newMode);
  }
  private http = inject(HttpClient);
  private statusService = inject(StatusService);
  private destroy$ = new Subject<void>();
  leads: LeadResponseDto[] = [];
  scriptOutput = '';
  loading = true; // Start with loading true
  hasRun = true; // Start with hasRun true
  expandedLeads = new Set<string>();
  showNaicsCodes = true; // Toggle for NAICS code display
  isSwitching = false; // Prevent accidental double clicks
  // Removed duplicate declaration

  ngOnInit() {
    // Sync with global mode
    this.statusService.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        const isNowLive = mode === 'live';
        const changedToLive = this.showSampleData && isNowLive;
        
        this.showSampleData = !isNowLive;

        if (changedToLive) {
          this.testLiveSam();
        } else {
          this.packLeads();
        }
      });
    
    this.updateDisplayedContracts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredLeads(): LeadResponseDto[] {
    if (this.showSampleData) {
      // Show all leads including sample data
      return this.leads;
    } else {
      // In live mode, show only leads that have live (non-sample) contracts
      return this.leads.filter(lead =>
        lead.contracts && lead.contracts.some(c => !c.sampleData && !c.isSample && !c.isTest)
      );
    }
  }

  get sampleCount(): number {
    // Count total number of sample contracts that would be displayed in sample mode
    return this.filteredLeads.flatMap(lead =>
      (lead.contracts ?? []).filter(c => c.sampleData || c.isSample)
    ).length;
  }

  getCurrentModeContractCount(): number {
    return this.filteredLeads.length;
  }

  get realCount(): number {
    return this.leads.filter(
      (lead) =>
  lead.contracts && lead.contracts.some((c) => !c.sampleData && !c.isTest)
    ).length;
  }

  get testCount(): number {
    return this.leads.filter(
      (lead) => lead.contracts && lead.contracts.some((c) => c.isTest)
    ).length;
  }

  hasSampleContracts(lead: LeadResponseDto): boolean {
  return lead.contracts?.some((c) => c.sampleData || c.isSample) || false;
  }

  hasRealContracts(lead: LeadResponseDto): boolean {
  return lead.contracts?.some((c) => !c.sampleData) || false;
  }

  formatValue(value: number): string {
    return value.toLocaleString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculateTotalValue(contracts: any[]): string {
    const total = contracts.reduce((sum, contract) => sum + contract.value, 0);
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

  packLeads() {
    this.loading = true;
    this.hasRun = true;
    const start = performance.now();
    const mode = this.showSampleData ? 'sample' : 'live';
    this.http
      .get<{ leads: LeadResponseDto[]; scriptOutput: string }>(`/api/pack?mode=${mode}`)
      .subscribe({
        next: (data) => {
          this.leads = data.leads;
          this.lastApiError = null; // Clear any previous API errors
          this.updateDisplayedContracts();
          this.scriptOutput = data.scriptOutput;
          this.loading = false;
          this.lastLatency = Math.round(performance.now() - start);
          this.lastSource = 'sample';
        },
        error: (err) => {
          console.error('Error packing leads:', err);
          this.loading = false;
        },
      });
  }

  testLiveSam() {
    this.loading = true;
    this.isSwitching = true;
    const start = performance.now();
    this.http
      .get<{
        success: boolean;
        message: string;
        contractsFound: number;
        contracts: LeadResponseDto[];
        quota?: string;
        timestamp: Date;
      }>('/api/sam/test-live')
      .subscribe(
        (data) => {
          if (!data.success) {
            // API error, such as rate limit
            const errorMessage = data.quota ? `${data.message} ${data.quota}` : data.message;
            this.lastApiError = errorMessage;
            alert(`❌ Found 0 contracts - API Error: ${errorMessage}`);
            // Switch to live mode to show the error
            this.packLeads();
            this.showSampleData = false;
            this.updateDisplayedContracts();
            this.cdr.detectChanges();
            this.loading = false;
            setTimeout(() => this.isSwitching = false, 3000);
            return;
          }
          // Log green in browser console for live response
          console.log('%c🟢 LIVE SAM.gov API Response:', 'color: green; font-weight: bold;', data);
          alert(
            `✅ SAM.gov API Test Complete!\n\nFound ${data.contractsFound} contracts under $250K with Small Business Set-Aside\n\nCheck console for full details.`
          );
          // Load all leads from database (including newly saved live data)
          this.packLeads();
          // Set to live mode
          this.showSampleData = false;
          this.lastApiError = null; // Clear any previous API errors
          this.updateDisplayedContracts();
          this.loading = false;
          this.lastLatency = Math.round(performance.now() - start);
          this.lastSource = 'live';
          setTimeout(() => this.isSwitching = false, 3000);
        },
        (err) => {
          console.error('Error testing SAM.gov API:', err);
          this.lastApiError = 'SAM.gov API access failed. Please check your API key.';
          alert('❌ SAM.gov API test failed. Check console for details.');
          this.loading = false;
          setTimeout(() => this.isSwitching = false, 3000);
        }
      );
  }

  searchNdIt() {
    this.loading = true;
    this.http
      .get<{
        success: boolean;
        message: string;
        contractsFound: number;
        naicsCodesSearched: string[];
        contracts: unknown[];
      }>('/api/sam/nd-it')
      .subscribe(
        (data) => {
          console.log('🔵 North Dakota IT Contracts Response:', data);

          const naicsDetails = `
📊 NAICS Codes Searched:
- 541512: Computer Systems Design Services
- 541511: Custom Computer Programming Services  
- 541513: Computer Facilities Management Services
- 541519: Other Computer Related Services
- 541690: Other Scientific and Technical Consulting Services (Cybersecurity)

🔍 Search Criteria:
- Contract Value: Under $250,000
- Set-Aside: Small Business (SBA)
- Date Range: Last 30 days
- Location: All U.S. (filtered for ND relevance)
        `.trim();

          if (data.contractsFound === 0) {
            alert(
              `⚠️ SAM.gov Search - Zero Results\n\n${naicsDetails}\n\n📋 Result: ${data.contractsFound} contracts found\n\nNote: Federal government operations may be affected by current events. No matching opportunities posted in the last 30 days.\n\nCheck console for full search details.`
            );
          } else {
            alert(
              `✅ ND IT Contract Search Complete!\n\n${naicsDetails}\n\n📋 Result: Found ${data.contractsFound} IT-related contracts\n\nCheck console for full details.`
            );
          }

          this.loading = false;
        },
        (err) => {
          console.error('Error searching ND IT contracts:', err);
          alert('❌ ND IT contract search failed. Check console for details.');
          this.loading = false;
        }
      );
  }
}
