import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserStorage } from '../storage/browser-storage';
import { ThemeStore } from './theme-store';

const STORAGE_KEY = 'photostream.theme';

function storeWith(stored: unknown) {
  const read = vi.fn((key: string) => (key === STORAGE_KEY ? stored : null));
  const write = vi.fn();

  TestBed.configureTestingModule({ providers: [{ provide: BrowserStorage, useValue: { read, write } }] });

  const store = TestBed.inject(ThemeStore);
  TestBed.tick();

  return { store, write };
}

function colorScheme(): string {
  return TestBed.inject(DOCUMENT).documentElement.style.colorScheme;
}

describe('ThemeStore', () => {
  afterEach(() => {
    TestBed.inject(DOCUMENT).documentElement.removeAttribute('style');
  });

  it('starts on system when nothing is stored', () => {
    expect(storeWith(null).store.mode()).toBe('system');
  });

  it('starts on the stored mode', () => {
    expect(storeWith('dark').store.mode()).toBe('dark');
  });

  it('starts on system when the stored value is not a theme mode', () => {
    expect(storeWith('sepia').store.mode()).toBe('system');
  });

  it('changes the mode and saves it', () => {
    const { store, write } = storeWith(null);

    store.select('dark');

    expect(store.mode()).toBe('dark');
    expect(write).toHaveBeenCalledWith(STORAGE_KEY, 'dark');
  });

  it.each([
    { mode: 'system', scheme: 'light dark' },
    { mode: 'light', scheme: 'light' },
    { mode: 'dark', scheme: 'dark' },
  ])('sets color-scheme to "$scheme" for $mode', ({ mode, scheme }) => {
    storeWith(mode);

    expect(colorScheme()).toBe(scheme);
  });

  it('updates color-scheme when the mode changes', () => {
    const { store } = storeWith('light');

    store.select('dark');
    TestBed.tick();

    expect(colorScheme()).toBe('dark');
  });
});
