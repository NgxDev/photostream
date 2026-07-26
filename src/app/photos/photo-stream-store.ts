import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, type, withMethods, withProps, withState } from '@ngrx/signals';
import { addEntities, entityConfig, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe } from 'rxjs';
import { Photo } from '../picsum/photo';
import { PicsumApi } from '../picsum/picsum-api';

interface PhotoStreamState {
  loading: boolean;
  scrollOffset: number;
}

const initialState: PhotoStreamState = {
  loading: false,
  scrollOffset: 0,
};

const streamPhotos = entityConfig({
  entity: type<Photo>(),
  selectId: (photo) => photo.internalId,
});

export const PhotoStreamStore = signalStore(
  { providedIn: 'root' },
  withState<PhotoStreamState>(initialState),
  withEntities(streamPhotos),
  withProps(() => ({
    api: inject(PicsumApi),
  })),
  withMethods((store) => {
    const loadMore = rxMethod<void>(
      pipe(
        exhaustMap(() => {
          patchState(store, { loading: true });

          return store.api.loadMore().pipe(
            tapResponse({
              next: (batch) => patchState(store, addEntities(batch, streamPhotos), { loading: false }),
              error: () => patchState(store, { loading: false }),
            })
          );
        })
      )
    );

    const rememberScrollOffset = (offset: number): void => {
      patchState(store, { scrollOffset: offset });
    };

    return { loadMore, rememberScrollOffset };
  })
);
