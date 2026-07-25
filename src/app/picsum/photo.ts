/**
 * A photo, as the app knows it.
 *
 * Every URL we need is derived from these four fields, so this is also the shape favorites take in
 * local storage.
 * Picsum's list response additionally carries `url` — an Unsplash page —
 * and `download_url`, which we can derive from `id`, `width` and `height`
 */
export interface Photo {
  readonly id: string;
  readonly author: string;
  readonly width: number;
  readonly height: number;
}
