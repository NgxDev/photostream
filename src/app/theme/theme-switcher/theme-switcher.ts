import { Component, inject } from '@angular/core';
import { MatButtonToggle, MatButtonToggleChange, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { isThemeMode, ThemeStore } from '../theme-store';

@Component({
  selector: 'ps-theme-switcher',
  imports: [MatButtonToggle, MatButtonToggleGroup, MatIcon],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.scss',
})
export class ThemeSwitcher {
  protected readonly store = inject(ThemeStore);

  protected select(change: MatButtonToggleChange): void {
    if (isThemeMode(change.value)) {
      this.store.select(change.value);
    }
  }
}
