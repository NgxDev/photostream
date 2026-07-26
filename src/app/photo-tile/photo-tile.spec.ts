import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Photo } from '../picsum/photo';
import { providePicsumImageLoader } from '../picsum/picsum-image-loader';
import { PhotoTile, PhotoTileMode } from './photo-tile';

const photo: Photo = { internalId: '7-0', id: '7', author: 'Ada Lovelace', width: 5000, height: 3333 };

describe('PhotoTile', () => {
  let fixture: ComponentFixture<PhotoTile>;

  async function show(next: Photo): Promise<void> {
    fixture.componentRef.setInput('photo', next);
    await fixture.whenStable();
  }

  async function showAs(mode: PhotoTileMode): Promise<void> {
    fixture.componentRef.setInput('mode', mode);
    await fixture.whenStable();
  }

  function image(): HTMLImageElement {
    return fixture.nativeElement.querySelector('img');
  }

  function control(): HTMLElement {
    return fixture.nativeElement.querySelector('.photo-tile__control');
  }

  function isShimmering(): boolean {
    return (fixture.nativeElement as HTMLElement).classList.contains('ps-shimmer');
  }

  async function finishLoading(): Promise<void> {
    image().dispatchEvent(new Event('load'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [providePicsumImageLoader(), provideRouter([])] });

    fixture = TestBed.createComponent(PhotoTile);
    await show(photo);
  });

  it('asks picsum for the photo behind the id it was given', () => {
    expect(image().getAttribute('src')).toContain('/id/7/');
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

  it('opens the photo page when it is not a save control', () => {
    expect(control().getAttribute('href')).toBe('/photos/7');
  });

  it.each([
    { mode: 'link', name: 'Photo by Ada Lovelace', badge: false, overlay: false },
    { mode: 'save', name: 'Save photo by Ada Lovelace to favorites', badge: false, overlay: false },
    { mode: 'saving', name: 'Saving photo by Ada Lovelace to favorites', badge: false, overlay: true },
    { mode: 'saved', name: 'Photo by Ada Lovelace, saved to favorites', badge: true, overlay: false },
    { mode: 'just-saved', name: 'Photo by Ada Lovelace, saved to favorites', badge: true, overlay: true },
  ] as const)('renders the $mode state', async ({ mode, name, badge, overlay }) => {
    await showAs(mode);
    const host = fixture.nativeElement as HTMLElement;

    expect(control().getAttribute('aria-label')).toBe(name);
    expect(host.querySelector('.photo-tile__badge') !== null).toBe(badge);
    expect(host.querySelector('.photo-tile__overlay') !== null).toBe(overlay);
  });

  it('asks to be saved when it is clicked', async () => {
    const saved: Photo[] = [];

    fixture.componentInstance.save.subscribe((next) => saved.push(next));
    await showAs('save');
    control().click();

    expect(saved).toEqual([photo]);
  });

  it.each(['saving', 'saved', 'just-saved'] as const)('does not ask to be saved again while %s', async (mode) => {
    const saved: Photo[] = [];

    fixture.componentInstance.save.subscribe((next) => saved.push(next));
    await showAs(mode);
    control().click();

    expect(control().getAttribute('aria-disabled')).toBe('true');
    expect(saved).toEqual([]);
  });
});
