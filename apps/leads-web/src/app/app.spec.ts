import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('span')?.textContent).toContain(
      'SAM Leads Manager'
    );
  });

  it('shows probe issue details when SAM API status clicked (fetch mocked)', async () => {
    const mockIssue = {
      total_count: 1,
      items: [
        {
          title: 'Weekly SANITY Probe: 2 ND-IT results found',
          updated_at: '2026-01-25T12:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/1',
        },
      ],
    };
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockIssue });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    await (app.showStatusDetails('samApi') as Promise<void>);
    expect(alertSpy).toHaveBeenCalled();
  });
});
