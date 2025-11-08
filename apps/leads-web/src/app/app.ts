import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { StatusService, ConnectionStatus, SystemStatus } from './services/status.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private statusService = inject(StatusService);
  private destroy$ = new Subject<void>();

  protected title = 'SAM Leads Manager';

  frontendStatus: ConnectionStatus = 'checking';
  backendStatus: ConnectionStatus = 'checking';
    backendLatency = 0;
  databaseStatus: ConnectionStatus = 'checking';
    databaseLatency = 0;
  samApiStatus: ConnectionStatus = 'checking';
    samApiLatency = 0;

  ngOnInit() {
    // Subscribe to status updates from the observable stream
    this.statusService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: SystemStatus) => {
        this.frontendStatus = status.frontend;
        this.backendStatus = status.backend;
        this.backendLatency = status.backendLatency ?? 0;
        this.databaseStatus = status.database;
        this.databaseLatency = status.databaseLatency ?? 0;
        this.samApiStatus = status.samApi;
        this.samApiLatency = status.samApiLatency ?? 0;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
