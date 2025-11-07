import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private http = inject(HttpClient);

  protected title = 'SAM Leads Manager';

  frontendStatus = 'online';
  backendStatus = 'checking...';
  databaseStatus = 'pending';
  samApiStatus = 'pending';

  ngOnInit() {
    this.checkBackendStatus();
    this.pollStatus();
  }

  checkBackendStatus() {
    this.http.get('/api', { responseType: 'text' }).subscribe({
      next: () => {
        this.backendStatus = 'online';
        this.databaseStatus = 'n/a';
        this.samApiStatus = 'pending';
      },
      error: () => {
        this.backendStatus = 'offline';
        this.databaseStatus = 'n/a';
        this.samApiStatus = 'n/a';
      },
    });
  }

  pollStatus() {
    setInterval(() => {
      this.checkBackendStatus();
    }, 30000); // Check every 30 seconds
  }
}
