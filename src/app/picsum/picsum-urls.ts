import { Photo } from './photo';

export const PICSUM_ORIGIN = 'https://picsum.photos';
export const PICSUM_MAX_DIMENSION = 5000;
export const TILE_ASPECT_RATIO = 2 / 3;

export function picsumImageUrl(id: string, width: number, height: number): string {
  const scale = Math.min(1, PICSUM_MAX_DIMENSION / width, PICSUM_MAX_DIMENSION / height);
  const fittedWidth = Math.round(width * scale);
  const fittedHeight = Math.round(height * scale);

  return `${PICSUM_ORIGIN}/id/${id}/${fittedWidth}/${fittedHeight}.webp`;
}

export function picsumDownloadUrl(photo: Photo): string {
  return `${PICSUM_ORIGIN}/id/${photo.id}/${photo.width}/${photo.height}`;
}
