import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeSwitcher } from '../theme/theme-switcher/theme-switcher';

@Component({
  selector: 'ps-header',
  imports: [MatIcon, MatTabLink, MatTabNav, RouterLink, RouterLinkActive, ThemeSwitcher],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly tabPanel = input.required<MatTabNavPanel>();
}
