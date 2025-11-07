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
  ],
  templateUrl: './pack-leads.component.html',
  styleUrl: './pack-leads.component.scss',
})
export class PackLeadsComponent implements OnInit {
  private http = inject(HttpClient);
  leads: LeadResponseDto[] = [];
  scriptOutput = '';
  loading = true; // Start with loading true
  hasRun = true; // Start with hasRun true
  expandedLeads = new Set<string>();
  showNaicsCodes = true; // Toggle for NAICS code display
  showSampleData = true; // Toggle for sample data display

  ngOnInit() {
    // Auto-load leads on component initialization
    this.packLeads();
  }

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

  get sampleCount(): number {
    // Count total number of sample contracts across all leads
    return this.leads.reduce((count, lead) => {
      const sampleContracts = lead.contracts?.filter((c) => c.isSample) || [];
      return count + sampleContracts.length;
    }, 0);
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
    this.http
      .get<{ leads: LeadResponseDto[]; scriptOutput: string }>('/api/pack')
      .subscribe({
        next: (data) => {
          this.leads = data.leads;
          this.scriptOutput = data.scriptOutput;
          this.loading = false;
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
    this.http
      .get<{
        success: boolean;
        message: string;
        contractsFound: number;
        contracts: unknown[];
      }>('/api/sam/test-live')
      .subscribe({
        next: (data) => {
          console.log('🔴 LIVE SAM.gov API Response:', data);
          alert(
            `✅ SAM.gov API Test Complete!\n\nFound ${data.contractsFound} contracts under $250K with Small Business Set-Aside\n\nCheck console for full details.`
          );
          this.loading = false;
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
