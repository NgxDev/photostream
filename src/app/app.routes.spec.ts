import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { BrowserStorage } from './storage/browser-storage';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: BrowserStorage, useValue: { read: () => null, write: () => undefined } },
        {
          provide: SwUpdate,
          useValue: { isEnabled: false, versionUpdates: new Subject(), unrecoverable: new Subject() },
        },
        { provide: MatSnackBar, useValue: { open: () => ({ onAction: () => new Subject() }) } },
      ],
    });
  });

  it('shows the header and nothing else on the shell route a static host serves as 404', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/shell');
    await fixture.whenStable();

    const host: HTMLElement = fixture.nativeElement;
    const outlet = host.querySelector('mat-tab-nav-panel router-outlet');

    expect(host.querySelector('ps-header')).not.toBeNull();
    expect(outlet?.nextElementSibling).toBeNull();
  });
});
