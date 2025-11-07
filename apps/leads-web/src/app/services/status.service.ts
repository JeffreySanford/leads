import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, switchMap, catchError, of, tap } from 'rxjs';

export type ConnectionStatus = 'online' | 'offline' | 'checking' | 'error';

export interface SystemStatus {
  frontend: ConnectionStatus;
  backend: ConnectionStatus;
  database: ConnectionStatus;
  samApi: ConnectionStatus;
  lastChecked: Date;
}

export interface BackendHealthResponse {
  status: string;
  database: {
    connected: boolean;
    status: string;
  };
  samApi: {
    connected: boolean;
    status: string;
    lastCheck?: Date;
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private http = inject(HttpClient);
  
  private readonly POLL_INTERVAL = 30000; // 30 seconds
  private readonly API_BASE = '/api';

  private statusSubject = new BehaviorSubject<SystemStatus>({
    frontend: 'online',
    backend: 'checking',
    database: 'checking',
    samApi: 'checking',
    lastChecked: new Date()
  });

  public status$: Observable<SystemStatus> = this.statusSubject.asObservable();

  constructor() {
    this.startPolling();
  }

  /**
   * Start polling backend for status updates
   */
  private startPolling(): void {
    // Initial check
    this.checkStatus();

    // Poll every 30 seconds
    interval(this.POLL_INTERVAL)
      .pipe(
        switchMap(() => this.checkStatus())
      )
      .subscribe();
  }

  /**
   * Check backend health endpoint
   */
  private checkStatus(): Observable<BackendHealthResponse | null> {
    return this.http.get<BackendHealthResponse>(`${this.API_BASE}/health`).pipe(
      tap((response) => {
        this.updateStatus({
          frontend: 'online',
          backend: response.status === 'ok' ? 'online' : 'error',
          database: response.database.connected ? 'online' : 'offline',
          samApi: response.samApi.connected ? 'online' : 'offline',
          lastChecked: new Date(response.timestamp)
        });
      }),
      catchError((error) => {
        console.error('Backend health check failed:', error);
        this.updateStatus({
          frontend: 'online',
          backend: 'offline',
          database: 'offline',
          samApi: 'offline',
          lastChecked: new Date()
        });
        return of(null);
      })
    );
  }

  /**
   * Update the status subject
   */
  private updateStatus(status: SystemStatus): void {
    this.statusSubject.next(status);
  }

  /**
   * Get current status snapshot
   */
  public getCurrentStatus(): SystemStatus {
    return this.statusSubject.value;
  }

  /**
   * Manually trigger a status check
   */
  public refresh(): Observable<BackendHealthResponse | null> {
    return this.checkStatus();
  }
}
