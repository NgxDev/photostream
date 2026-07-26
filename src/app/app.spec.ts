import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { App } from './app';
import { BrowserStorage } from './storage/browser-storage';

const versionReady: VersionReadyEvent = {
  type: 'VERSION_READY',
  currentVersion: { hash: 'old' },
  latestVersion: { hash: 'new' },
};

describe('App', () => {
  let host: HTMLElement;
  let versionUpdates: Subject<VersionEvent>;
  let unrecoverable: Subject<UnrecoverableStateEvent>;
  let open: ReturnType<typeof vi.fn>;
  let action: Subject<void>;

  beforeEach(async () => {
    versionUpdates = new Subject<VersionEvent>();
    unrecoverable = new Subject<UnrecoverableStateEvent>();
    action = new Subject<void>();
    open = vi.fn(() => ({ onAction: () => action }));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BrowserStorage, useValue: { read: () => null, write: () => undefined } },
        { provide: SwUpdate, useValue: { isEnabled: true, versionUpdates, unrecoverable } },
        { provide: MatSnackBar, useValue: { open } },
      ],
    });

    const fixture = TestBed.createComponent(App);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(DOCUMENT).documentElement.removeAttribute('style');
  });

  it('renders the routed view inside the tab panel', () => {
    const panel = host.querySelector('mat-tab-nav-panel');

    expect(panel?.querySelector('router-outlet')).not.toBeNull();
  });

  it('offers a reload once a new version is ready to be used', () => {
    versionUpdates.next(versionReady);

    expect(open).toHaveBeenCalledWith('A new version of photostream is available', 'Reload', expect.anything());
  });

  it('says nothing while a new version is only being downloaded', () => {
    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });

    expect(open).not.toHaveBeenCalled();
  });

  it('offers a reload when the app can no longer be served from the cache', () => {
    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'a cached file went missing' });

    expect(open).toHaveBeenCalledWith('photostream needs to reload to keep working', 'Reload', expect.anything());
  });

  it('waits for the reload offer to be taken', () => {
    expect(action.observed).toBe(false);

    versionUpdates.next(versionReady);

    expect(action.observed).toBe(true);
  });
});
