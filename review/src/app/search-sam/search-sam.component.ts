import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-sam',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatListModule, FormsModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Search SAM</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-form-field>
          <mat-label>Search Term</mat-label>
          <input matInput [(ngModel)]="term">
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="search()">Search</button>
        <mat-list *ngIf="results.length > 0">
          <mat-list-item *ngFor="let result of results">{{result}}</mat-list-item>
        </mat-list>
      </mat-card-content>
    </mat-card>
  `,
})
export class SearchSamComponent {
  private http = inject(HttpClient);
  term = '';
  results: string[] = [];

  search() {
    this.http.post<{ results: string[] }>('http://localhost:3000/api/search', { term: this.term }).subscribe({
      next: (data) => this.results = data.results,
      error: (err) => console.error(err),
    });
  }
}