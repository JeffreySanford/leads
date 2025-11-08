import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

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
    isSample?: boolean;
    isTest?: boolean;
  }[];
}

@Component({
  selector: 'app-pack-leads',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './pack-leads.component.html',
  styleUrl: './pack-leads.component.scss',
})
export class PackLeadsComponent implements OnInit {
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
  // Material table data source for sample contracts
  sampleContracts: Array<{
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

  get filteredSampleContracts() {
    let contracts = this.sampleContracts;
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

  get filteredSampleContractsTotal() {
    let contracts = this.sampleContracts;
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

  updateSampleContracts() {
    // Flatten sample contracts from filteredLeads
    this.sampleContracts = (this.filteredLeads ?? []).flatMap(lead =>
      (lead.contracts ?? [])
        .filter(c => c.isSample)
        .map(c => ({ ...c, leadId: lead.leadId, companyName: lead.companyName }))
    );
  }

  onTableFilterChange(value: string) {
    this.tableFilter = value;
    this.pageIndex = 0;
  }

  onTablePageChange(event: { pageIndex: number; pageSize: number }) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  lastLatency: number | null = null;
  lastSource: 'sample' | 'live' = 'sample';
  showSampleData = true; // Live data OFF by default
  // ...existing code...
  showLabOverlay = false;
  showSampleContracts = true;

  toggleLabOverlay() {
    this.showLabOverlay = !this.showLabOverlay;
    this.showSampleContracts = true;
  }
  constructor() { /* empty */ }


  toggleSampleData() {
    if (!this.showSampleData) {
      // Switch back to sample data
      this.packLeads();
      this.showSampleData = true;
      this.lastSource = 'sample';
    } else {
      // Switch to live data (if available)
      this.showSampleData = false;
      this.lastSource = 'live';
    }
  }
  private http = inject(HttpClient);
  leads: LeadResponseDto[] = [];
  scriptOutput = '';
  loading = true; // Start with loading true
  hasRun = true; // Start with hasRun true
  expandedLeads = new Set<string>();
  showNaicsCodes = true; // Toggle for NAICS code display
  // Removed duplicate declaration

  ngOnInit() {
  // Auto-load leads on component initialization
  this.showSampleData = true;
  this.packLeads();
  this.updateSampleContracts();
  }

  get filteredLeads(): LeadResponseDto[] {
    if (this.showSampleData) {
      // Show all leads including sample data
      return this.leads;
    } else {
      // Show only live data (leads with probeStatus 'live')
      return this.leads.filter(lead => lead.probeStatus === 'live');
    }
  }

  get sampleCount(): number {
    // Count total number of sample contracts in the current filteredLeads
    return this.filteredLeads.reduce((count, lead) => {
      const sampleContracts = lead.contracts?.filter((c) => c.isSample) || [];
      return count + sampleContracts.length;
    }, 0);
  }

  get sampleLeadCount(): number {
    // Count number of leads with at least one sample contract in filteredLeads
    return this.filteredLeads.filter(lead => this.hasSampleContracts(lead)).length;
  }

  get realCount(): number {
    return this.leads.filter(
      (lead) =>
        lead.contracts && lead.contracts.some((c) => !c.isSample && !c.isTest)
    ).length;
  }

  get testCount(): number {
    return this.leads.filter(
      (lead) => lead.contracts && lead.contracts.some((c) => c.isTest)
    ).length;
  }

  hasSampleContracts(lead: LeadResponseDto): boolean {
    return lead.contracts?.some((c) => c.isSample) || false;
  }

  hasRealContracts(lead: LeadResponseDto): boolean {
    return lead.contracts?.some((c) => !c.isSample) || false;
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
    console.log('Toggle expand called for:', leadId);
    if (this.expandedLeads.has(leadId)) {
      this.expandedLeads.delete(leadId);
      console.log('Collapsed:', leadId);
    } else {
      this.expandedLeads.add(leadId);
      console.log(
        'Expanded:',
        leadId,
        'Total expanded:',
        this.expandedLeads.size
      );
    }
  }

  isExpanded(leadId: string): boolean {
    return this.expandedLeads.has(leadId);
  }

  packLeads() {
    this.loading = true;
    this.hasRun = true;
    const start = performance.now();
    this.http
      .get<{ leads: LeadResponseDto[]; scriptOutput: string }>('/api/pack')
      .subscribe({
        next: (data) => {
          this.leads = data.leads;
          this.updateSampleContracts();
          this.scriptOutput = data.scriptOutput;
          this.loading = false;
          this.lastLatency = Math.round(performance.now() - start);
          this.lastSource = 'sample';
          this.showSampleData = true;
          console.log('Packed leads from MongoDB:', data);
          console.log('First lead contracts:', data.leads[0]?.contracts);
        },
        error: (err) => {
          console.error('Error packing leads:', err);
          this.loading = false;
        },
      });
  }

  testLiveSam() {
    this.loading = true;
    const start = performance.now();
    this.http
      .get<{
        success: boolean;
        message: string;
        contractsFound: number;
        contracts: LeadResponseDto[];
      }>('/api/sam/test-live')
      .subscribe({
        next: (data) => {
          // Log green in browser console for live response
          console.log('%c🟢 LIVE SAM.gov API Response:', 'color: green; font-weight: bold;', data);
          alert(
            `✅ SAM.gov API Test Complete!\n\nFound ${data.contractsFound} contracts under $250K with Small Business Set-Aside\n\nCheck console for full details.`
          );
          // Set to live mode and show live contracts
          this.showSampleData = false;
          this.leads = data.contracts;
          this.updateSampleContracts();
          this.loading = false;
          this.lastLatency = Math.round(performance.now() - start);
          this.lastSource = 'live';
        },
        error: (err) => {
          console.error('Error testing SAM.gov API:', err);
          alert('❌ SAM.gov API test failed. Check console for details.');
          this.loading = false;
        },
      });
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
      .subscribe({
        next: (data) => {
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
        error: (err) => {
          console.error('Error searching ND IT contracts:', err);
          alert('❌ ND IT contract search failed. Check console for details.');
          this.loading = false;
        },
      });
  }
}
