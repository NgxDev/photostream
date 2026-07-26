import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableWindow,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { PhotoTile } from '../photo-tile/photo-tile';
import { Photo } from '../picsum/photo';
import { gridMetrics } from './grid-metrics';

function toRows(photos: readonly Photo[], columns: number): readonly Photo[][] {
  if (columns < 1) {
    return [];
  }

  const rows: Photo[][] = [];

  for (let index = 0; index < photos.length; index += columns) {
    rows.push(photos.slice(index, index + columns));
  }

  return rows;
}

@Component({
  selector: 'ps-photo-grid',
  imports: [
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollableWindow,
    CdkVirtualScrollViewport,
    PhotoTile,
  ],
  templateUrl: './photo-grid.html',
  styleUrl: './photo-grid.scss',
  host: {
    '[style.minHeight.px]': 'rows().length * rowHeight()',
  },
})
export class PhotoGrid {
  readonly photos = input.required<readonly Photo[]>();
  readonly ready = computed(() => this.rowHeight() > 0);

  protected readonly rowHeight = signal(0);
  protected readonly rows = computed(() => toRows(this.photos(), this.columns()));
  protected readonly trackRow = (_index: number, row: readonly Photo[]): string => row[0].internalId;

  private readonly columns = signal(0);
  private readonly viewport = viewChild(CdkVirtualScrollViewport);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly view = inject(DOCUMENT).defaultView;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const element = this.host.nativeElement;
      const observer = new ResizeObserver((entries) => this.measure(element, entries[0].contentRect.width));

      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private measure(element: HTMLElement, width: number): void {
    const metrics = this.view ? gridMetrics(this.view.getComputedStyle(element), width) : null;

    if (!metrics) {
      return;
    }

    this.columns.set(metrics.columns);
    this.rowHeight.set(metrics.rowHeight);
    this.viewport()?.checkViewportSize();
  }
}
