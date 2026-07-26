import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../empty-state/empty-state';
import { PhotoGrid } from '../photo-grid/photo-grid';
import { FavoritesStore } from './favorites-store';

@Component({
  selector: 'ps-favorites',
  imports: [EmptyState, MatButton, MatIcon, MatProgressSpinner, PhotoGrid, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites {
  protected readonly store = inject(FavoritesStore);

  protected readonly count = computed(() => {
    const saved = this.store.entities().length;

    return saved === 1 ? '1 photo' : `${saved} photos`;
  });
}
