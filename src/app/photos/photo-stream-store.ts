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
  stalled: boolean;
  scrollOffset: number;
}

const initialState: PhotoStreamState = {
  loading: false,
  stalled: false,
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
          // Stalled until a batch proves otherwise, so an error, an empty page or a response that
          // never arrives all leave the stream waiting to be asked again rather than retrying.
          patchState(store, { loading: true, stalled: true });

          return store.api.loadMore().pipe(
            tapResponse({
              next: (batch) => {
                const countBefore = store.entities().length;

                patchState(store, addEntities(batch, streamPhotos));
                patchState(store, { stalled: store.entities().length === countBefore });
              },
              error: () => patchState(store, { stalled: true }),
              finalize: () => patchState(store, { loading: false }),
            })
          );
        })
      )
    );

    const resume = (): void => {
      patchState(store, { stalled: false });
    };

    const rememberScrollOffset = (offset: number): void => {
      patchState(store, { scrollOffset: offset });
    };

    return { loadMore, rememberScrollOffset, resume };
  })
);
