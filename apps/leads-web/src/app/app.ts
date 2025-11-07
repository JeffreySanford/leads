import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { StatusService, ConnectionStatus } from './services/status.service';
import { Subject, takeUntil } from 'rxjs';

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
export class App implements OnInit, OnDestroy {
  private statusService = inject(StatusService);
  private destroy$ = new Subject<void>();

  protected title = 'SAM Leads Manager';

  frontendStatus: ConnectionStatus = 'checking';
  backendStatus: ConnectionStatus = 'checking';
  databaseStatus: ConnectionStatus = 'checking';
  samApiStatus: ConnectionStatus = 'checking';

  ngOnInit() {
    // Subscribe to status updates from the observable stream
    this.statusService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.frontendStatus = status.frontend;
        this.backendStatus = status.backend;
        this.databaseStatus = status.database;
        this.samApiStatus = status.samApi;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
