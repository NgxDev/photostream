/**
 * A photo, as the app knows it.
 *
 * Every URL we need is derived from `id`, `width` and `height`, so those three plus `author` are
 * the shape favorites take in local storage, keyed by `id`.
 * Picsum's list response additionally carries `url` — an Unsplash page —
 * and `download_url`, which we can derive from `id`, `width` and `height`
 *
 * `internalId` gives `track` and `withEntities` a unique key, which `id` cannot once the stream has
 * been through the whole catalog and starts handing out the same photos again.
 */
export interface Photo {
  readonly internalId: string;
  readonly id: string;
  readonly author: string;
  readonly width: number;
  readonly height: number;
}
