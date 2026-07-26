import { ViewportScroller } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { FakeIntersectionObserver, FakeResizeObserver } from '../../fake-observers';
import { Photo } from '../picsum/photo';
import { PicsumApi } from '../picsum/picsum-api';
import { providePicsumImageLoader } from '../picsum/picsum-image-loader';
import { PhotoStreamStore } from './photo-stream-store';
import { Photos } from './photos';

const SCROLLED_TO = 900;
const COLUMNS = 5;
const GRID_WIDTH = 1236;
const GRID_GAP = '14px';

function photo(id: string): Photo {
  return { internalId: `${id}-0`, id, author: `Author ${id}`, width: 5000, height: 3333 };
}

function batchOf(size: number): Photo[] {
  return Array.from({ length: size }, (_, index) => photo(String(index + 1)));
}

describe('Photos', () => {
  let fixture: ComponentFixture<Photos>;

  async function showPhotos(scrolledTo = 0) {
    const loadMore = vi.fn<() => Observable<Photo[]>>(() => of([]));
    const scrollToPosition = vi.fn();
    const api: Pick<PicsumApi, 'loadMore'> = { loadMore };
    const scroller: Pick<ViewportScroller, 'getScrollPosition' | 'scrollToPosition'> = {
      getScrollPosition: () => [0, SCROLLED_TO],
      scrollToPosition,
    };

    TestBed.configureTestingModule({
      providers: [
        providePicsumImageLoader(),
        { provide: PicsumApi, useValue: api },
        { provide: ViewportScroller, useValue: scroller },
      ],
    });

    const store = TestBed.inject(PhotoStreamStore);

    if (scrolledTo > 0) {
      store.rememberScrollOffset(scrolledTo);
    }

    fixture = TestBed.createComponent(Photos);
    await fixture.whenStable();

    return { loadMore, scrollToPosition, store };
  }

  async function reachTheEndOfTheStream(): Promise<void> {
    FakeIntersectionObserver.latest?.comeIntoView();

    await fixture.whenStable();
  }

  async function layOutGrid(): Promise<void> {
    const grid: HTMLElement = fixture.nativeElement.querySelector('ps-photo-grid');

    grid.style.setProperty('--ps-columns', String(COLUMNS));
    grid.style.setProperty('--ps-grid-gap', GRID_GAP);
    FakeResizeObserver.latest?.resizeTo(GRID_WIDTH);

    await fixture.whenStable();
  }

  function spinner(): Element | null {
    return fixture.nativeElement.querySelector('mat-spinner');
  }

  function placeholders(): NodeListOf<Element> {
    return fixture.nativeElement.querySelectorAll('.photos__placeholder-cell');
  }

  afterEach(() => {
    FakeIntersectionObserver.latest = undefined;
    FakeResizeObserver.latest = undefined;
  });

  it('looks for the end of the stream a screen early', async () => {
    await showPhotos();

    expect(FakeIntersectionObserver.latest?.options.rootMargin).toBe('100% 0px');
  });

  it('asks for more photos when the end of the stream comes into view', async () => {
    const { loadMore } = await showPhotos();

    await reachTheEndOfTheStream();

    expect(loadMore).toHaveBeenCalled();
  });

  it('shows the spinner only while a batch is on its way', async () => {
    const batch = new Subject<Photo[]>();
    const { loadMore } = await showPhotos();

    loadMore.mockReturnValue(batch);

    expect(spinner()).toBeNull();

    await reachTheEndOfTheStream();

    expect(spinner()).not.toBeNull();

    batch.next(batchOf(1));
    batch.complete();
    await fixture.whenStable();

    expect(spinner()).toBeNull();
  });

  it('fills the grid with placeholders until the first photos arrive', async () => {
    const batch = new Subject<Photo[]>();
    const { loadMore } = await showPhotos();

    loadMore.mockReturnValue(batch);

    await reachTheEndOfTheStream();

    expect(placeholders().length).toBeGreaterThan(0);

    batch.next(batchOf(30));
    batch.complete();
    await fixture.whenStable();

    expect(placeholders()).toHaveLength(0);
  });

  it('remembers where the stream was scrolled when you navigate away', async () => {
    const { store } = await showPhotos();

    fixture.destroy();

    expect(store.scrollOffset()).toBe(SCROLLED_TO);
  });

  it('puts you back where you were when you return to the stream', async () => {
    const { loadMore, scrollToPosition } = await showPhotos(1200);

    loadMore.mockReturnValue(of(batchOf(30)));

    await reachTheEndOfTheStream();
    await layOutGrid();

    expect(scrollToPosition).toHaveBeenCalledWith([0, 1200]);
  });
});
