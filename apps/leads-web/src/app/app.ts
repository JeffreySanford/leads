import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AppMode, StatusService, ConnectionStatus, SystemStatus } from './services/status.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonToggleModule,
  ],
})
export class App implements OnInit, OnDestroy {
  private statusService = inject(StatusService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  protected title = 'SAM Leads Manager';
  appMode: AppMode = 'live';

  frontendStatus: ConnectionStatus = 'checking';
  backendStatus: ConnectionStatus = 'checking';
    backendLatency = 0;
  databaseStatus: ConnectionStatus = 'checking';
    databaseLatency = 0;
  samApiStatus: ConnectionStatus = 'checking';
    samApiLatency = 0;

  ngOnInit() {
    // Subscribe to mode changes
    this.statusService.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => this.appMode = mode);

    // Subscribe to router events (no debug logging)
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Router event handling without debug logs
    });

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

  onModeChange(mode: AppMode) {
    this.statusService.setMode(mode);
  }

  showStatusDetails(kind: 'frontend' | 'backend' | 'database' | 'samApi') {
    const parts: Record<string, string> = {
      frontend: `Frontend — status: ${this.frontendStatus}`,
      backend: `Backend API — status: ${this.backendStatus}; latency: ${Math.round(this.backendLatency)} ms`,
      database: `Database — status: ${this.databaseStatus}; latency: ${Math.round(this.databaseLatency)} ms`,
      samApi: `SAM.gov API — status: ${this.samApiStatus}; latency: ${Math.round(this.samApiLatency)} ms`,
    };
    const msg = parts[kind] ?? `Status: ${kind}`;
    const nav = navigator as unknown as { clipboard?: { writeText: (text: string) => Promise<void> } };
    if (nav.clipboard?.writeText) {
      nav.clipboard.writeText(msg).then(() => {
        console.log('Status details copied to clipboard:', msg);
        alert(msg);
      }).catch(() => alert(msg));
    } else {
      alert(msg);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
