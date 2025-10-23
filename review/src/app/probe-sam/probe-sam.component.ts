import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-probe-sam',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Probe SAM</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-form-field>
          <mat-label>Lead ID</mat-label>
          <input matInput [(ngModel)]="leadId">
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="probe()">Probe</button>
        <p *ngIf="result">{{result}}</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class ProbeSamComponent {
  private http = inject(HttpClient);
  leadId = '';
  result = '';

  probe() {
    this.http.post<{ result: string }>('http://localhost:3000/api/probe', { leadId: this.leadId }).subscribe({
      next: (data) => this.result = data.result,
      error: (err) => console.error(err),
    });
  }
}