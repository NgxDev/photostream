import { ViewportScroller } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PhotoGrid } from '../photo-grid/photo-grid';
import { PAGE_SIZE } from '../picsum/picsum-api';
import { PhotoStreamStore } from './photo-stream-store';

export const PREFETCH_SCREENS = 1;

@Component({
  selector: 'ps-photos',
  imports: [MatProgressSpinner, PhotoGrid],
  templateUrl: './photos.html',
  styleUrl: './photos.scss',
})
export class Photos {
  protected readonly store = inject(PhotoStreamStore);
  protected readonly placeholders = Array.from({ length: PAGE_SIZE });

  private readonly grid = viewChild.required(PhotoGrid);
  private readonly endOfStream = viewChild.required<ElementRef<HTMLElement>>('endOfStream');
  private readonly scroller = inject(ViewportScroller);
  private readonly window = inject(DOCUMENT).defaultView;
  private scrolledTo = 0;
  private restored = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const onScroll = (): void => this.followTheScroll();

      this.window?.addEventListener('scroll', onScroll, { passive: true });

      destroyRef.onDestroy(() => {
        this.window?.removeEventListener('scroll', onScroll);
        this.store.rememberScrollOffset(this.scrolledTo);
      });
    });

    // Runs again after every batch, so a screen taller than one batch keeps filling on its own
    // instead of waiting for a scroll that never comes.
    afterRenderEffect(() => this.loadMoreWhenTheEndIsNear());

    afterRenderEffect(() => this.returnToWhereYouWere());
  }

  // Navigating away removes the grid first, which shrinks the page and drops the scroll position,
  // so it has to be followed while the screen is still there rather than read on the way out.
  private followTheScroll(): void {
    this.scrolledTo = this.scroller.getScrollPosition()[1];

    if (this.store.stalled()) {
      this.store.resume();
    }

    this.loadMoreWhenTheEndIsNear();
  }

  private loadMoreWhenTheEndIsNear(): void {
    if (this.store.loading() || this.store.stalled() || !this.theEndIsNear()) {
      return;
    }

    this.store.loadMore();
  }

  private theEndIsNear(): boolean {
    if (!this.window) {
      return false;
    }

    const distance = this.endOfStream().nativeElement.getBoundingClientRect().top;

    return distance <= this.window.innerHeight * (1 + PREFETCH_SCREENS);
  }

  private returnToWhereYouWere(): void {
    const offset = this.store.scrollOffset();

    if (this.restored || offset === 0 || !this.grid().ready()) {
      return;
    }

    this.restored = true;
    this.scroller.scrollToPosition([0, offset]);
  }
}
