import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';

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
    isSample?: boolean;
    isTest?: boolean;
  }[];
}

@Component({
  selector: 'app-search-sam',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    FormsModule,
  ],
  templateUrl: './search-sam.component.html',
  styleUrl: './search-sam.component.scss',
})
export class SearchSamComponent {
  private http = inject(HttpClient);
  term = '';
  leads: LeadResponseDto[] = [];
  searchTotal = 0;
  loading = false;
  hasRun = false;
  expandedLeads = new Set<string>();
  showNaicsCodes = true; // Toggle for NAICS code display
  showSampleData = true; // Toggle for sample data display

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

  search() {
    this.loading = true;
    this.hasRun = true;
    this.leads = [];
    this.searchTotal = 0;
    this.http
      .post<{ results: string[]; total: number; leads: LeadResponseDto[] }>(
        '/api/search',
        { term: this.term }
      )
      .subscribe({
        next: (data) => {
          this.leads = data.leads || [];
          this.searchTotal = data.total || 0;
          this.loading = false;
          console.log('Search results from MongoDB:', data);
        },
        error: (err) => {
          console.error('Error searching SAM:', err);
          this.loading = false;
        },
      });
  }
}
