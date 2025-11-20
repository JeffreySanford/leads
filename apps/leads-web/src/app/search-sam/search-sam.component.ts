import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  templateUrl: './search-sam.component.html',
  styleUrls: ['./search-sam.component.scss'],
  standalone: false,
})
export class SearchSamComponent implements OnInit {
  debugInfo = '';

  http = inject(HttpClient);
  router = inject(Router);
  route = inject(ActivatedRoute);

  ngOnInit() {
    // Router debugging
    this.debugInfo += `Component initialized at ${new Date().toISOString()}\n`;
    this.debugInfo += `Current URL: ${this.router.url}\n`;
    this.debugInfo += `Route path: ${this.route.snapshot.url.map(segment => segment.path).join('/')}\n`;
    this.debugInfo += `Route params: ${JSON.stringify(this.route.snapshot.params)}\n`;
    this.debugInfo += `Route query params: ${JSON.stringify(this.route.snapshot.queryParams)}\n`;

    // Listen to router events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.debugInfo += `NavigationEnd: ${event.url}\n`;
        console.log('Search SAM Router Event:', event);
      });

    console.log('Search SAM Component Debug Info:', {
      url: this.router.url,
      route: this.route.snapshot,
      params: this.route.snapshot.params,
      queryParams: this.route.snapshot.queryParams
    });
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
  mathCeil(value: number): number {
    return Math.ceil(value);
  }
  term = '';
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
        {
          term: this.term,
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
          console.log('Search results from MongoDB:', data);
        },
        error: (err) => {
          console.error('Error searching SAM:', err);
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
