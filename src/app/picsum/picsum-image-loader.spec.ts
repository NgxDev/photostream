import { IMAGE_CONFIG, IMAGE_LOADER } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PICSUM_BREAKPOINTS, picsumImageLoader, providePicsumImageLoader } from './picsum-image-loader';
import { PICSUM_MAX_DIMENSION } from './picsum-urls';

describe('picsumImageLoader', () => {
  it('uses the height NgOptimizedImage derives for each srcset candidate', () => {
    expect(picsumImageLoader({ src: '42', width: 400, height: 600 })).toBe('https://picsum.photos/id/42/400/600.webp');
  });

  it('falls back to the 2:3 tile ratio when no height is supplied', () => {
    expect(picsumImageLoader({ src: '42', width: 384 })).toBe('https://picsum.photos/id/42/384/576.webp');
  });

  it('falls back to a default width for the plain src attribute, which carries no width', () => {
    expect(picsumImageLoader({ src: '42' })).toBe('https://picsum.photos/id/42/640/960.webp');
  });

  it('scales a candidate that would exceed the dimension picsum accepts', () => {
    expect(picsumImageLoader({ src: '42', width: 3840, height: 5760 })).toBe(
      'https://picsum.photos/id/42/3333/5000.webp'
    );
  });

  it('keeps every breakpoint within the 5000px limit picsum enforces, at a 2:3 ratio', () => {
    for (const width of PICSUM_BREAKPOINTS) {
      const height = Math.round(width * 1.5);

      expect(height).toBeLessThanOrEqual(PICSUM_MAX_DIMENSION);
      expect(picsumImageLoader({ src: '42', width })).toBe(`https://picsum.photos/id/42/${width}/${height}.webp`);
    }
  });
});

describe('providePicsumImageLoader', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [providePicsumImageLoader()] });
  });

  it('registers the picsum loader', () => {
    expect(TestBed.inject(IMAGE_LOADER)).toBe(picsumImageLoader);
  });

  it('registers the tuned breakpoints', () => {
    expect(TestBed.inject(IMAGE_CONFIG).breakpoints).toEqual(PICSUM_BREAKPOINTS);
  });
});
