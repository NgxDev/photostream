import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Photo } from '../picsum/photo';
import { FavoritesApi } from './favorites-api';
import { CONFIRMATION_MS, FavoritesStore } from './favorites-store';

function photo(id: string): Photo {
  return { internalId: id, id, author: `Author ${id}`, width: 5000, height: 3333 };
}

function createStore(read: Observable<Photo[]> = of([])) {
  const add = vi.fn<(photo: Photo) => Observable<Photo>>((photo) => of(photo));
  const remove = vi.fn<(id: string) => Observable<string>>((id) => of(id));
  const api: Pick<FavoritesApi, 'read' | 'add' | 'remove'> = { read: () => read, add, remove };

  TestBed.configureTestingModule({ providers: [{ provide: FavoritesApi, useValue: api }] });

  return { add, remove, store: TestBed.inject(FavoritesStore) };
}

describe('FavoritesStore', () => {
  it('is not loaded until the first read comes back', () => {
    const favorites = new Subject<Photo[]>();
    const { store } = createStore(favorites);

    expect(store.loaded()).toBe(false);

    favorites.next([photo('7')]);
    favorites.complete();

    expect(store.loaded()).toBe(true);
  });

  it('is loaded even when the read fails', () => {
    const { store } = createStore(throwError(() => new Error('storage is unreadable')));

    expect(store.loaded()).toBe(true);
    expect(store.entities()).toEqual([]);
  });

  it('holds the favorites in the order they were read', () => {
    const { store } = createStore(of([photo('9'), photo('7')]));

    expect(store.entities().map(({ id }) => id)).toEqual(['9', '7']);
  });

  it('puts a newly saved photo at the front', () => {
    const { store } = createStore(of([photo('1')]));

    store.save(photo('7'));

    expect(store.entities().map(({ id }) => id)).toEqual(['7', '1']);
  });

  it('marks a photo pending while its save is on its way', () => {
    const { add, store } = createStore();
    const saving = new Subject<Photo>();

    add.mockReturnValue(saving);
    store.save(photo('7'));

    expect(store.pendingIds()).toEqual(['7']);

    saving.next(photo('7'));
    saving.complete();

    expect(store.pendingIds()).toEqual([]);
  });

  it('ignores a second click while a save is on its way', () => {
    const { add, store } = createStore();

    add.mockReturnValue(new Subject<Photo>());

    store.save(photo('7'));
    store.save(photo('7'));

    expect(add).toHaveBeenCalledTimes(1);
  });

  it('ignores a click on a photo that is already saved', () => {
    const { add, store } = createStore(of([photo('7')]));

    store.save(photo('7'));

    expect(add).not.toHaveBeenCalled();
  });

  it('saves two photos at the same time', () => {
    const { add, store } = createStore();
    const first = new Subject<Photo>();
    const second = new Subject<Photo>();

    add.mockReturnValueOnce(first).mockReturnValueOnce(second);

    store.save(photo('7'));
    store.save(photo('9'));

    expect(store.pendingIds()).toEqual(['7', '9']);

    second.next(photo('9'));
    second.complete();

    expect(store.entities().map(({ id }) => id)).toEqual(['9']);
    expect(store.pendingIds()).toEqual(['7']);
  });

  it('leaves a photo unsaved and not pending when its save fails', () => {
    const { add, store } = createStore();

    add.mockReturnValue(throwError(() => new Error('storage is full')));
    store.save(photo('7'));

    expect(store.entities()).toEqual([]);
    expect(store.pendingIds()).toEqual([]);
  });

  it('drops a photo once its removal has gone through', () => {
    const { store } = createStore(of([photo('9'), photo('7')]));

    store.remove('7');

    expect(store.entities().map(({ id }) => id)).toEqual(['9']);
  });

  it('marks a photo pending while its removal is on its way', () => {
    const { remove, store } = createStore(of([photo('7')]));
    const removing = new Subject<string>();

    remove.mockReturnValue(removing);
    store.remove('7');

    expect(store.pendingIds()).toEqual(['7']);
    expect(store.entities()).toHaveLength(1);

    removing.next('7');
    removing.complete();

    expect(store.pendingIds()).toEqual([]);
    expect(store.entities()).toEqual([]);
  });

  it('ignores a second click while a removal is on its way', () => {
    const { remove, store } = createStore(of([photo('7')]));

    remove.mockReturnValue(new Subject<string>());

    store.remove('7');
    store.remove('7');

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('keeps the photo when its removal fails', () => {
    const { remove, store } = createStore(of([photo('7')]));

    remove.mockReturnValue(throwError(() => new Error('storage is unwritable')));
    store.remove('7');

    expect(store.entities().map(({ id }) => id)).toEqual(['7']);
    expect(store.pendingIds()).toEqual([]);
  });

  it('marks the photo it has just saved until the confirmation has been seen', async () => {
    vi.useFakeTimers();
    const { store } = createStore();

    store.save(photo('7'));

    expect(store.justSavedId()).toBe('7');

    await vi.advanceTimersByTimeAsync(CONFIRMATION_MS);

    expect(store.justSavedId()).toBeNull();
    vi.useRealTimers();
  });
});
