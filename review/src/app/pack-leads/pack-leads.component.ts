import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

interface Lead {
  lead_id: number;
  company: string;
  naics_code: string;
}

@Component({
  selector: 'app-pack-leads',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatListModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Pack ND NAICS Leads</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <button mat-raised-button color="primary" (click)="packLeads()">Pack Leads</button>
        <mat-list *ngIf="leads.length > 0">
          <mat-list-item *ngFor="let lead of leads">
            {{lead.lead_id}} - {{lead.company}} - {{lead.naics_code}}
          </mat-list-item>
        </mat-list>
      </mat-card-content>
    </mat-card>
  `,
})
export class PackLeadsComponent {
  private http = inject(HttpClient);
  leads: Lead[] = [];

  packLeads() {
    this.http.get<{ leads: Lead[] }>('http://localhost:3000/api/pack').subscribe({
      next: (data) => this.leads = data.leads,
      error: (err) => console.error(err),
    });
  }
}