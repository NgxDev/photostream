import { ViewportScroller } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  DestroyRef,
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
  private restored = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new IntersectionObserver((entries) => this.loadMoreWhenSeen(entries), {
        rootMargin: `${PREFETCH_SCREENS * 100}% 0px`,
      });

      observer.observe(this.endOfStream().nativeElement);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        this.store.rememberScrollOffset(this.scroller.getScrollPosition()[1]);
      });
    });

    afterRenderEffect(() => {
      const offset = this.store.scrollOffset();

      if (this.restored || offset === 0 || !this.grid().ready()) {
        return;
      }

      this.restored = true;
      this.scroller.scrollToPosition([0, offset]);
    });
  }

  private loadMoreWhenSeen(entries: IntersectionObserverEntry[]): void {
    if (entries.some((entry) => entry.isIntersecting)) {
      this.store.loadMore();
    }
  }
}
