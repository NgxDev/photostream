import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { pageTitle, PageTitleStrategy } from './page-title-strategy';

@Component({ selector: 'ps-blank', template: '' })
class Blank {}

describe('pageTitle', () => {
  it('puts the page before the app name', () => {
    expect(pageTitle('Favorites')).toBe('Favorites | Photostream');
  });

  it('is the app name alone when a page has no title of its own', () => {
    expect(pageTitle(undefined)).toBe('Photostream');
  });
});

describe('PageTitleStrategy', () => {
  it('names the tab after the route it navigated to', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'favorites', title: 'Favorites', component: Blank },
          { path: 'nowhere', component: Blank },
        ]),
        { provide: TitleStrategy, useClass: PageTitleStrategy },
      ],
    });

    const harness = await RouterTestingHarness.create('/favorites');

    expect(TestBed.inject(Title).getTitle()).toBe('Favorites | Photostream');

    await harness.navigateByUrl('/nowhere');

    expect(TestBed.inject(Title).getTitle()).toBe('Photostream');
  });
});
