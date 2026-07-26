import { Photo } from './photo';
import { picsumDownloadUrl, picsumImageUrl } from './picsum-urls';

describe('picsumImageUrl', () => {
  it('builds a webp URL from an id and explicit dimensions', () => {
    expect(picsumImageUrl('42', 400, 600)).toBe('https://picsum.photos/id/42/400/600.webp');
  });

  it('scales down a request that is too tall, keeping the aspect ratio', () => {
    expect(picsumImageUrl('42', 3840, 5760)).toBe('https://picsum.photos/id/42/3333/5000.webp');
  });

  it('scales down a request that is too wide, keeping the aspect ratio', () => {
    expect(picsumImageUrl('42', 6000, 4000)).toBe('https://picsum.photos/id/42/5000/3333.webp');
  });

  it('accepts a dimension of exactly 5000', () => {
    expect(picsumImageUrl('42', 5000, 5000)).toBe('https://picsum.photos/id/42/5000/5000.webp');
  });

  it('rounds fractional dimensions to whole pixels', () => {
    expect(picsumImageUrl('42', 400.4, 600.6)).toBe('https://picsum.photos/id/42/400/601.webp');
  });
});

describe('picsumDownloadUrl', () => {
  it('points at the original file, at full size and with no extension', () => {
    const photo: Photo = { internalId: '1084-0', id: '1084', author: 'Jay Ruzesky', width: 4579, height: 3271 };

    expect(picsumDownloadUrl(photo)).toBe('https://picsum.photos/id/1084/4579/3271');
  });
});
