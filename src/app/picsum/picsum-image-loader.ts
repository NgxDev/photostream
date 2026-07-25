import { IMAGE_CONFIG, IMAGE_LOADER, ImageLoader } from '@angular/common';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { picsumImageUrl, TILE_ASPECT_RATIO } from './picsum-urls';

export const PICSUM_BREAKPOINTS = [256, 384, 640, 828, 1080, 1280, 1920, 2560, 3200];

const WIDTH_FOR_SRC_ATTRIBUTE = 640;

export const picsumImageLoader: ImageLoader = ({ src, width, height }) => {
  const requestedWidth = width ?? WIDTH_FOR_SRC_ATTRIBUTE;
  const tileHeight = Math.round(requestedWidth / TILE_ASPECT_RATIO);

  return picsumImageUrl(src, requestedWidth, height ?? tileHeight);
};

export function providePicsumImageLoader(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: IMAGE_LOADER, useValue: picsumImageLoader },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: PICSUM_BREAKPOINTS } },
  ]);
}
