import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonToggleGroupHarness, MatButtonToggleHarness } from '@angular/material/button-toggle/testing';
import { BrowserStorage } from '../../storage/browser-storage';
import { ThemeStore } from '../theme-store';
import { ThemeSwitcher } from './theme-switcher';

describe('ThemeSwitcher', () => {
  let store: InstanceType<typeof ThemeStore>;
  let toggles: MatButtonToggleHarness[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: BrowserStorage, useValue: { read: () => null, write: () => undefined } }],
    });

    const fixture = TestBed.createComponent(ThemeSwitcher);
    store = TestBed.inject(ThemeStore);

    const group = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatButtonToggleGroupHarness);
    toggles = await group.getToggles();
  });

  afterEach(() => {
    TestBed.inject(DOCUMENT).documentElement.removeAttribute('style');
  });

  it('gives every segment an accessible name', async () => {
    const labels = await Promise.all(toggles.map((toggle) => toggle.getAriaLabel()));

    expect(labels).toEqual(['Match system theme', 'Light theme', 'Dark theme']);
  });

  it('checks the segment for the current theme', async () => {
    expect(await toggles[0].isChecked()).toBe(true);
  });

  it('changes the theme when a segment is checked', async () => {
    await toggles[2].check();

    expect(store.mode()).toBe('dark');
  });

  it('moves the checked segment when the theme changes elsewhere', async () => {
    store.select('light');

    expect(await toggles[1].isChecked()).toBe(true);
  });
});
