import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, type, withHooks, withMethods, withProps, withState } from '@ngrx/signals';
import { entityConfig, prependEntity, removeEntity, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, mergeMap, pipe, switchMap, tap, timer } from 'rxjs';
import { Photo } from '../picsum/photo';
import { FavoritesApi } from './favorites-api';

export const CONFIRMATION_MS = 800;

interface FavoritesState {
  loaded: boolean;
  pendingIds: readonly string[];
  justSavedId: string | null;
}

const initialState: FavoritesState = {
  loaded: false,
  pendingIds: [],
  justSavedId: null,
};

const favoritePhotos = entityConfig({
  entity: type<Photo>(),
  selectId: (photo) => photo.id,
});

export const FavoritesStore = signalStore(
  { providedIn: 'root' },
  withState<FavoritesState>(initialState),
  withEntities(favoritePhotos),
  withProps(() => ({
    api: inject(FavoritesApi),
  })),
  withMethods((store) => {
    const load = rxMethod<void>(
      pipe(
        switchMap(() =>
          store.api.read().pipe(
            tapResponse({
              next: (favorites) => patchState(store, setAllEntities(favorites, favoritePhotos)),
              error: () => undefined,
              finalize: () => patchState(store, { loaded: true }),
            })
          )
        )
      )
    );

    const clearConfirmation = rxMethod<void>(
      pipe(
        switchMap(() => timer(CONFIRMATION_MS)),
        tap(() => patchState(store, { justSavedId: null }))
      )
    );

    const save = rxMethod<Photo>(
      pipe(
        filter((photo) => !store.pendingIds().includes(photo.id) && !store.ids().includes(photo.id)),
        tap((photo) => patchState(store, { pendingIds: [...store.pendingIds(), photo.id] })),
        mergeMap((photo) =>
          store.api.add(photo).pipe(
            tapResponse({
              next: (saved) => {
                patchState(store, prependEntity(saved, favoritePhotos), { justSavedId: saved.id });
                clearConfirmation();
              },
              error: () => undefined,
              finalize: () => patchState(store, { pendingIds: store.pendingIds().filter((id) => id !== photo.id) }),
            })
          )
        )
      )
    );

    const remove = rxMethod<string>(
      pipe(
        filter((id) => !store.pendingIds().includes(id)),
        tap((id) => patchState(store, { pendingIds: [...store.pendingIds(), id] })),
        mergeMap((id) =>
          store.api.remove(id).pipe(
            tapResponse({
              next: (removed) => patchState(store, removeEntity(removed)),
              error: () => undefined,
              finalize: () => patchState(store, { pendingIds: store.pendingIds().filter((each) => each !== id) }),
            })
          )
        )
      )
    );

    return { load, save, remove };
  }),
  withHooks((store) => ({
    onInit() {
      store.load();
    },
  }))
);
