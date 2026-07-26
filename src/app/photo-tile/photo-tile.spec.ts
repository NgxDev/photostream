import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Photo } from '../picsum/photo';
import { providePicsumImageLoader } from '../picsum/picsum-image-loader';
import { PhotoTile } from './photo-tile';

const photo: Photo = { internalId: '7-0', id: '7', author: 'Ada Lovelace', width: 5000, height: 3333 };

describe('PhotoTile', () => {
  let fixture: ComponentFixture<PhotoTile>;

  async function show(next: Photo): Promise<void> {
    fixture.componentRef.setInput('photo', next);
    await fixture.whenStable();
  }

  function image(): HTMLImageElement {
    return fixture.nativeElement.querySelector('img');
  }

  function isShimmering(): boolean {
    return (fixture.nativeElement as HTMLElement).classList.contains('ps-shimmer');
  }

  async function finishLoading(): Promise<void> {
    image().dispatchEvent(new Event('load'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [providePicsumImageLoader()] });

    fixture = TestBed.createComponent(PhotoTile);
    await show(photo);
  });

  it('asks picsum for the photo behind the id it was given', () => {
    expect(image().getAttribute('src')).toContain('/id/7/');
  });

  it('names the photo by its author', () => {
    expect(image().alt).toBe('Photo by Ada Lovelace');
  });

  it('shimmers until the image has loaded', async () => {
    expect(isShimmering()).toBe(true);

    await finishLoading();

    expect(isShimmering()).toBe(false);
  });

  it('shimmers again when another photo takes its place', async () => {
    await finishLoading();

    await show({ ...photo, internalId: '9-0', id: '9' });

    expect(isShimmering()).toBe(true);
  });
});
