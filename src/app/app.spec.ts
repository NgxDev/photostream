import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { BrowserStorage } from './storage/browser-storage';

describe('App', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BrowserStorage, useValue: { read: () => null, write: () => undefined } },
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
});
