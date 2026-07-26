import { Component, DOCUMENT, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabNavPanel } from '@angular/material/tabs';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Header } from './header/header';

const RELOAD_OFFER_MS = 10_000;

@Component({
  selector: 'ps-root',
  imports: [Header, MatTabNavPanel, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const updates = inject(SwUpdate);

    updates.versionUpdates
      .pipe(
        filter((event) => event.type === 'VERSION_READY'),
        takeUntilDestroyed()
      )
      .subscribe(() => this.offerReload('A new version of photostream is available', RELOAD_OFFER_MS));

    updates.unrecoverable
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.offerReload('photostream needs to reload to keep working'));
  }

  private offerReload(message: string, duration?: number): void {
    this.snackBar
      .open(message, 'Reload', { duration })
      .onAction()
      .subscribe(() => this.document.location.reload());
  }
}
