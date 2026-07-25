import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';

@Service()
export class BrowserStorage {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  read<T>(key: string): T | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const stored = localStorage.getItem(key);

      return stored === null ? null : (JSON.parse(stored) as T);
    } catch {
      return null;
    }
  }

  write(key: string, value: unknown): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  }
}
