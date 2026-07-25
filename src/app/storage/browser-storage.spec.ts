import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserStorage } from './browser-storage';

const KEY = 'photostream.theme';

function storageOn(platform: string): BrowserStorage {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });

  return TestBed.inject(BrowserStorage);
}

describe('BrowserStorage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores a value and reads it back', () => {
    const storage = storageOn('browser');

    storage.write(KEY, { mode: 'dark' });

    expect(storage.read(KEY)).toEqual({ mode: 'dark' });
  });

  it('returns null for a key that does not exist', () => {
    expect(storageOn('browser').read(KEY)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    localStorage.setItem(KEY, 'not json');

    expect(storageOn('browser').read(KEY)).toBeNull();
  });

  it('removes a value', () => {
    const storage = storageOn('browser');
    storage.write(KEY, 'dark');

    storage.remove(KEY);

    expect(storage.read(KEY)).toBeNull();
  });

  it('returns null while prerendering', () => {
    localStorage.setItem(KEY, '"dark"');

    expect(storageOn('server').read(KEY)).toBeNull();
  });

  it('does not write while prerendering', () => {
    storageOn('server').write(KEY, 'dark');

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('returns null when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });

    expect(storageOn('browser').read(KEY)).toBeNull();
  });

  it('does not throw when a write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => storageOn('browser').write(KEY, 'dark')).not.toThrow();
  });

  it('does not throw when a removal fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('access denied');
    });

    expect(() => storageOn('browser').remove(KEY)).not.toThrow();
  });
});
