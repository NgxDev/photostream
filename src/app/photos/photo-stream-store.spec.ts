import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Photo } from '../picsum/photo';
import { PicsumApi } from '../picsum/picsum-api';
import { PhotoStreamStore } from './photo-stream-store';

function photo(id: string): Photo {
  return { internalId: `${id}-0`, id, author: `Author ${id}`, width: 5000, height: 3333 };
}

function createStore() {
  const loadMore = vi.fn<() => Observable<Photo[]>>(() => of([]));
  const api: Pick<PicsumApi, 'loadMore'> = { loadMore };

  TestBed.configureTestingModule({ providers: [{ provide: PicsumApi, useValue: api }] });

  return { loadMore, store: TestBed.inject(PhotoStreamStore) };
}

describe('PhotoStreamStore', () => {
  it('appends every batch it loads to the stream', () => {
    const { loadMore, store } = createStore();

    loadMore.mockReturnValueOnce(of([photo('1'), photo('2')])).mockReturnValueOnce(of([photo('3')]));

    store.loadMore();
    store.loadMore();

    expect(store.entities().map(({ id }) => id)).toEqual(['1', '2', '3']);
  });

  it('is loading only while a batch is on its way', () => {
    const { loadMore, store } = createStore();
    const batch = new Subject<Photo[]>();

    loadMore.mockReturnValue(batch);

    expect(store.loading()).toBe(false);

    store.loadMore();

    expect(store.loading()).toBe(true);

    batch.next([photo('1')]);
    batch.complete();

    expect(store.loading()).toBe(false);
  });

  it('ignores a request made while a batch is already on its way', () => {
    const { loadMore, store } = createStore();

    loadMore.mockReturnValue(new Subject<Photo[]>());

    store.loadMore();
    store.loadMore();

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('stops loading when a batch fails, so the next one can still be asked for', () => {
    const { loadMore, store } = createStore();

    loadMore.mockReturnValueOnce(throwError(() => new Error('picsum is unreachable')));

    store.loadMore();

    expect(store.loading()).toBe(false);

    loadMore.mockReturnValueOnce(of([photo('1')]));
    store.loadMore();

    expect(store.entities()).toHaveLength(1);
  });

  it('remembers how far the stream was scrolled', () => {
    const { store } = createStore();

    store.rememberScrollOffset(1200);

    expect(store.scrollOffset()).toBe(1200);
  });
});
