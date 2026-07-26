import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ps-empty-state',
  imports: [MatIcon],
  template: `
    <span class="empty-state__badge" aria-hidden="true">
      <span class="empty-state__glyph"
        ><mat-icon inline>{{ icon() }}</mat-icon></span
      >
    </span>

    <h1 class="empty-state__heading">{{ heading() }}</h1>
    <p class="empty-state__message">{{ message() }}</p>

    <div class="empty-state__action">
      <ng-content />
    </div>
  `,
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
}
