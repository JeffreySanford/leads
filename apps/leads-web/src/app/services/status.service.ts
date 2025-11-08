export type ConnectionStatus = 'online' | 'offline' | 'checking' | 'error';

export interface SystemStatus {
  frontend: ConnectionStatus;
  backend: ConnectionStatus;
  database: ConnectionStatus;
  samApi: ConnectionStatus;
  lastChecked: Date;
  backendLatency?: number;
  databaseLatency?: number;
  samApiLatency?: number;
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, switchMap, catchError, of, tap, map } from 'rxjs';


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
    lastChecked: new Date(),
    backendLatency: 0,
    databaseLatency: 0,
    samApiLatency: 0
  });

  public status$: Observable<SystemStatus> = this.statusSubject.asObservable();
  public backendStatus$: Observable<{status: ConnectionStatus, latency: number}> = this.status$.pipe(map(s => ({status: s.backend, latency: s.backendLatency ?? 0})));
  public databaseStatus$: Observable<{status: ConnectionStatus, latency: number}> = this.status$.pipe(map(s => ({status: s.database, latency: s.databaseLatency ?? 0})));
  public samApiStatus$: Observable<{status: ConnectionStatus, latency: number}> = this.status$.pipe(map(s => ({status: s.samApi, latency: s.samApiLatency ?? 0})));

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
    const start = performance.now();
    return this.http.get<BackendHealthResponse>(`${this.API_BASE}/health`).pipe(
      tap((response) => {
        const backendLatency = performance.now() - start;
        // Simulate separate latency for database and samApi (could be split in backend for more accuracy)
        const databaseLatency = backendLatency * 0.5;
        const samApiLatency = backendLatency * 0.5;
        this.updateStatus({
          frontend: 'online',
          backend: response.status === 'ok' ? 'online' : 'error',
          database: response.database.connected ? 'online' : 'offline',
          samApi: response.samApi.connected ? 'online' : 'offline',
          lastChecked: new Date(response.timestamp),
          backendLatency,
          databaseLatency,
          samApiLatency
        });
      }),
      catchError((error) => {
        console.error('Backend health check failed:', error);
        this.updateStatus({
          frontend: 'online',
          backend: 'offline',
          database: 'offline',
          samApi: 'offline',
          lastChecked: new Date(),
          backendLatency: 0,
          databaseLatency: 0,
          samApiLatency: 0
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
