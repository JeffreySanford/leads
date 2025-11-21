import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusService, ConnectionStatus, SystemStatus } from './services/status.service';
import { Subject, takeUntil } from 'rxjs';
import { Router, NavigationStart, NavigationEnd, NavigationError, NavigationCancel, RoutesRecognized } from '@angular/router';

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
  ],
})
export class App implements OnInit, OnDestroy {
  private statusService = inject(StatusService);
  private router = inject(Router);
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
    // Router debugging
    console.log('🔍 ROUTER DEBUG: App component initialized');
    console.log('🔍 ROUTER DEBUG: Current URL:', this.router.url);
    console.log('🔍 ROUTER DEBUG: Router config:', this.router.config);

    // Subscribe to router events
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationStart) {
        console.log('🚀 ROUTER EVENT: NavigationStart -', event.url);
      } else if (event instanceof RoutesRecognized) {
        console.log('🔍 ROUTER EVENT: RoutesRecognized -', event.url);
        console.log('🔍 ROUTER EVENT: Route config:', event.state.root.firstChild?.routeConfig);
      } else if (event instanceof NavigationEnd) {
        console.log('✅ ROUTER EVENT: NavigationEnd -', event.url);
        console.log('✅ ROUTER EVENT: Final URL:', event.urlAfterRedirects);
      } else if (event instanceof NavigationError) {
        console.error('❌ ROUTER EVENT: NavigationError -', event.error);
        console.error('❌ ROUTER EVENT: Failed URL:', event.url);
      } else if (event instanceof NavigationCancel) {
        console.warn('⚠️ ROUTER EVENT: NavigationCancel -', event.url);
        console.warn('⚠️ ROUTER EVENT: Reason:', event.reason);
      }
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNavClick(route: string) {
    console.log('🔍 NAVIGATION: Click detected on route:', route);
    console.log('🔍 NAVIGATION: Current router state:', {
      url: this.router.url,
      navigated: this.router.navigated
    });
  }
}
