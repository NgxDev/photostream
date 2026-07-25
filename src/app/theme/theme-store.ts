import { DOCUMENT, effect, inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals';
import { BrowserStorage } from '../storage/browser-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

const STORAGE_KEY = 'photostream.theme';

const COLOR_SCHEME: Record<ThemeMode, string> = {
  dark: 'dark',
  light: 'light',
  system: 'light dark',
};

const initialState: ThemeState = {
  mode: 'system',
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState<ThemeState>(initialState),
  withProps(() => ({
    document: inject(DOCUMENT),
    storage: inject(BrowserStorage),
  })),
  withMethods((store) => {
    const select = (mode: ThemeMode): void => {
      patchState(store, { mode });
      store.storage.write(STORAGE_KEY, mode);
    };

    return { select };
  }),
  withHooks((store) => ({
    onInit() {
      const stored = store.storage.read(STORAGE_KEY);

      if (isThemeMode(stored)) {
        patchState(store, { mode: stored });
      }

      effect(() => {
        store.document.documentElement.style.colorScheme = COLOR_SCHEME[store.mode()];
      });
    },
  }))
);
