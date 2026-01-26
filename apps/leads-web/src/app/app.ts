import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  AppMode,
  StatusService,
  ConnectionStatus,
  SystemStatus,
} from './services/status.service';
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
      .subscribe((mode) => (this.appMode = mode));

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
      backend: `Backend API — status: ${
        this.backendStatus
      }; latency: ${Math.round(this.backendLatency)} ms`,
      database: `Database — status: ${
        this.databaseStatus
      }; latency: ${Math.round(this.databaseLatency)} ms`,
      samApi: `SAM.gov API — status: ${
        this.samApiStatus
      }; latency: ${Math.round(this.samApiLatency)} ms`,
    };

    const fallbackMsg = parts[kind] ?? `Status: ${kind}`;

    if (kind === 'samApi') {
      // Try to surface the latest weekly-sanity-probe GitHub issue (public, no secret required)
      return (async () => {
        try {
          const repo = 'JeffreySanford/leads';
          const q = encodeURIComponent(
            `repo:${repo} label:weekly-sanity-probe is:issue is:open`
          );
          const url = `https://api.github.com/search/issues?q=${q}&sort=updated&order=desc`;
          const res = await fetch(url, { method: 'GET' });
          if (!res.ok) throw new Error(`GitHub API ${res.status}`);
          const data = await res.json();
          if (
            data.total_count &&
            data.total_count > 0 &&
            Array.isArray(data.items) &&
            data.items.length > 0
          ) {
            const issue = data.items[0];
            const msg = `Last probe: ${issue.title}\nUpdated: ${new Date(
              issue.updated_at
            ).toLocaleString()}\nLink: ${issue.html_url}`;
            alert(msg);
            return;
          }
        } catch (err) {
          // ignore and fall back to backend/local status
          console.debug(
            'Could not fetch probe issue:',
            (err as any).message ?? err
          );
        }
        // fallback
        const nav = navigator as unknown as {
          clipboard?: { writeText: (text: string) => Promise<void> };
        };
        if (nav.clipboard?.writeText) {
          nav.clipboard
            .writeText(fallbackMsg)
            .then(() => alert(fallbackMsg))
            .catch(() => alert(fallbackMsg));
        } else {
          alert(fallbackMsg);
        }
      })();
    }

    const msg = parts[kind] ?? `Status: ${kind}`;
    const nav = navigator as unknown as {
      clipboard?: { writeText: (text: string) => Promise<void> };
    };
    if (nav.clipboard?.writeText) {
      nav.clipboard
        .writeText(msg)
        .then(() => {
          console.log('Status details copied to clipboard:', msg);
          alert(msg);
        })
        .catch(() => alert(msg));
    } else {
      alert(msg);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
