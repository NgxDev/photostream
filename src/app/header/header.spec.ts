import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, DOCUMENT } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTabNavPanel } from '@angular/material/tabs';
import { MatTabNavBarHarness } from '@angular/material/tabs/testing';
import { provideRouter, Router } from '@angular/router';
import { BrowserStorage } from '../storage/browser-storage';
import { Header } from './header';

@Component({ selector: 'ps-blank', template: '' })
class Blank {}

@Component({
  selector: 'ps-header-host',
  imports: [Header, MatTabNavPanel],
  template: '<ps-header [tabPanel]="panel" /><mat-tab-nav-panel #panel />',
})
class HeaderHost {}

describe('Header', () => {
  let fixture: ComponentFixture<HeaderHost>;
  let host: HTMLElement;
  let navBar: MatTabNavBarHarness;

  async function navigateTo(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'favorites', component: Blank },
        ]),
        { provide: BrowserStorage, useValue: { read: () => null, write: () => undefined } },
      ],
    });

    fixture = TestBed.createComponent(HeaderHost);
    host = fixture.nativeElement;
    await fixture.whenStable();

    navBar = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatTabNavBarHarness);
  });

  afterEach(() => {
    TestBed.inject(DOCUMENT).documentElement.removeAttribute('style');
  });

  it('links to the photos and favorites screens', () => {
    const links = Array.from(host.querySelectorAll('a'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/favorites']);
    expect(links.map((link) => link.querySelector('.header__tab-label')?.textContent)).toEqual(['Photos', 'Favorites']);
  });

  it('marks the link for the current route active', async () => {
    const [photos, favorites] = await navBar.getLinks();

    await navigateTo('/');

    expect(await photos.isActive()).toBe(true);
    expect(await favorites.isActive()).toBe(false);

    await navigateTo('/favorites');

    expect(await photos.isActive()).toBe(false);
    expect(await favorites.isActive()).toBe(true);
  });
});
