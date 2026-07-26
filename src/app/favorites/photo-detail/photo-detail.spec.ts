import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { Photo } from '../../picsum/photo';
import { PICSUM_BREAKPOINTS, providePicsumImageLoader } from '../../picsum/picsum-image-loader';
import { FavoritesApi } from '../favorites-api';
import { FavoritesStore } from '../favorites-store';
import { PhotoDetail, photoInFavorites, stageSizes, stageSrcset } from './photo-detail';

function photo(id: string, width = 5000, height = 3333): Photo {
  return { internalId: id, id, author: `Author ${id}`, width, height };
}

describe('photoInFavorites', () => {
  const favorites = [photo('9'), photo('7'), photo('1')];

  it('finds the photo with the given id', () => {
    expect(photoInFavorites(favorites, '7')?.photo.author).toBe('Author 7');
  });

  it('finds nothing when the id is not a favorite', () => {
    expect(photoInFavorites(favorites, '42')).toBeNull();
  });

  it('reports where the photo sits among the favorites', () => {
    expect(photoInFavorites(favorites, '7')?.counter).toBe('2 / 3');
  });

  it.each([
    { id: '9', previousId: '1', nextId: '7' },
    { id: '7', previousId: '9', nextId: '1' },
    { id: '1', previousId: '7', nextId: '9' },
  ])('names the favorites on either side of $id, wrapping around', ({ id, previousId, nextId }) => {
    expect(photoInFavorites(favorites, id)).toMatchObject({ previousId, nextId });
  });

  it('says the photo is on its own when it is the only favorite', () => {
    expect(photoInFavorites([photo('7')], '7')?.alone).toBe(true);
    expect(photoInFavorites(favorites, '7')?.alone).toBe(false);
  });
});

describe('stageSizes', () => {
  it.each([
    { shape: 'landscape', width: 5000, height: 3333, sizes: 'min(100vw, calc(100dvh * 1.5))' },
    { shape: 'portrait', width: 3000, height: 4000, sizes: 'min(100vw, calc(100dvh * 0.75))' },
  ])('keeps a $shape photo within the viewport width and the stage height', ({ width, height, sizes }) => {
    expect(stageSizes(photo('7', width, height))).toBe(sizes);
  });
});

describe('stageSrcset', () => {
  it('offers every breakpoint at the shape of the photo', () => {
    const candidates = stageSrcset(photo('7', 3000, 4000)).split(', ');

    expect(candidates).toHaveLength(PICSUM_BREAKPOINTS.length);
    expect(candidates[0]).toBe('https://picsum.photos/id/7/256/341.webp 256w');
    expect(candidates.at(-1)).toBe('https://picsum.photos/id/7/3200/4267.webp 3200w');
  });

  it('stays inside the size picsum will serve for a tall photo', () => {
    const candidates = stageSrcset(photo('7', 1510, 2445)).split(', ');

    expect(candidates.at(-1)).toBe('https://picsum.photos/id/7/3088/5000.webp 3200w');
  });
});

describe('PhotoDetail', () => {
  let fixture: ComponentFixture<PhotoDetail>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let store: InstanceType<typeof FavoritesStore>;
  let remove: ReturnType<typeof vi.fn<(id: string) => Observable<string>>>;

  async function showPhoto(id: string, saved: Photo[]): Promise<PhotoDetail> {
    remove = vi.fn<(id: string) => Observable<string>>((removed) => of(removed));

    const api: Pick<FavoritesApi, 'read' | 'add' | 'remove'> = {
      read: () => of(saved),
      add: (next) => of(next),
      remove,
    };

    TestBed.configureTestingModule({
      providers: [providePicsumImageLoader(), provideRouter([]), { provide: FavoritesApi, useValue: api }],
    });

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    store = TestBed.inject(FavoritesStore);
    fixture = TestBed.createComponent(PhotoDetail);
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();

    return fixture.componentInstance;
  }

  async function press(key: string, from: EventTarget = document.body): Promise<void> {
    from.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await fixture.whenStable();
  }

  it.each([
    { key: 'ArrowLeft', neighbour: '9' },
    { key: 'ArrowRight', neighbour: '1' },
  ])('opens a neighbouring favorite on $key', async ({ key, neighbour }) => {
    await showPhoto('7', [photo('9'), photo('7'), photo('1')]);

    await press(key);

    expect(navigate).toHaveBeenCalledWith(['/photos', neighbour]);
  });

  it('leaves the arrow keys alone when another control has the focus', async () => {
    await showPhoto('7', [photo('9'), photo('7')]);
    const elsewhere = document.body.appendChild(document.createElement('button'));

    await press('ArrowRight', elsewhere);
    elsewhere.remove();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores the arrow keys when the photo is the only favorite', async () => {
    await showPhoto('7', [photo('7')]);

    await press('ArrowRight');

    expect(navigate).not.toHaveBeenCalled();
  });

  it('stops listening for arrow keys once it is gone', async () => {
    await showPhoto('7', [photo('9'), photo('7')]);

    fixture.destroy();
    await press('ArrowRight');

    expect(navigate).not.toHaveBeenCalled();
  });

  it('stays on the photo until its removal has gone through', async () => {
    const detail = await showPhoto('7', [photo('9'), photo('7')]);
    const removal = new Subject<string>();

    remove.mockReturnValue(removal);
    detail.remove();
    await fixture.whenStable();

    expect(store.pendingIds()).toEqual(['7']);
    expect(navigate).not.toHaveBeenCalled();

    removal.next('7');
    removal.complete();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/photos', '9']);
  });

  it('opens the next favorite once the photo has been removed', async () => {
    const detail = await showPhoto('7', [photo('9'), photo('7'), photo('1')]);

    detail.remove();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith('7');
    expect(navigate).toHaveBeenCalledWith(['/photos', '1']);
  });

  it('goes back to the favorites when the last one is removed', async () => {
    const detail = await showPhoto('7', [photo('7')]);

    detail.remove();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/favorites']);
  });

  it.each([
    { when: 'the photo is a favorite', id: '7', expected: 'Photo by Author 7 | Photostream' },
    { when: 'the id is not a favorite', id: '42', expected: 'Photo not found | Photostream' },
  ])('names the tab after $when', async ({ id, expected }) => {
    await showPhoto(id, [photo('7')]);

    expect(TestBed.inject(Title).getTitle()).toBe(expected);
  });

  it('does nothing when asked to remove a photo that is not a favorite', async () => {
    const detail = await showPhoto('42', [photo('7')]);

    detail.remove();
    await fixture.whenStable();

    expect(remove).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
