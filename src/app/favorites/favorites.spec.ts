import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { FakeResizeObserver } from '../../fake-observers';
import { Photo } from '../picsum/photo';
import { providePicsumImageLoader } from '../picsum/picsum-image-loader';
import { Favorites } from './favorites';
import { FavoritesApi } from './favorites-api';

const COLUMNS = 5;
const GRID_GAP = '14px';
const GRID_WIDTH = 1236;

function photo(id: string): Photo {
  return { internalId: id, id, author: `Author ${id}`, width: 5000, height: 3333 };
}

function batchOf(size: number): Photo[] {
  return Array.from({ length: size }, (_, index) => photo(String(index + 1)));
}

describe('Favorites', () => {
  let fixture: ComponentFixture<Favorites>;

  async function showFavorites(saved: Observable<Photo[]>) {
    const api: Pick<FavoritesApi, 'read' | 'add'> = { read: () => saved, add: (next) => of(next) };

    TestBed.configureTestingModule({
      providers: [providePicsumImageLoader(), provideRouter([]), { provide: FavoritesApi, useValue: api }],
    });

    fixture = TestBed.createComponent(Favorites);
    await fixture.whenStable();
  }

  async function layOutGrid(): Promise<void> {
    const grid: HTMLElement = fixture.nativeElement.querySelector('ps-photo-grid');

    grid.style.setProperty('--ps-columns', String(COLUMNS));
    grid.style.setProperty('--ps-grid-gap', GRID_GAP);
    FakeResizeObserver.latest?.resizeTo(GRID_WIDTH);
    await fixture.whenStable();
  }

  function find(selector: string): Element | null {
    return fixture.nativeElement.querySelector(selector);
  }

  afterEach(() => {
    FakeResizeObserver.latest = undefined;
  });

  it('says it is loading until the favorites arrive', async () => {
    const saved = new Subject<Photo[]>();
    await showFavorites(saved);

    expect(find('[role="status"]')?.textContent).toContain('Loading favorites');
    expect(find('ps-empty-state')).toBeNull();

    saved.next([]);
    saved.complete();
    await fixture.whenStable();

    expect(find('[role="status"]')).toBeNull();
  });

  it('offers a way back to the stream when nothing is saved', async () => {
    await showFavorites(of([]));

    expect(find('ps-empty-state')?.textContent).toContain('Nothing saved yet');
    expect(find('ps-empty-state a')?.getAttribute('href')).toBe('/');
  });

  it('shows the saved photos once they arrive', async () => {
    await showFavorites(of(batchOf(4)));
    await layOutGrid();

    expect(fixture.nativeElement.querySelectorAll('ps-photo-tile')).toHaveLength(4);
    expect(find('ps-empty-state')).toBeNull();
  });

  it.each([
    { saved: 1, count: '1 photo' },
    { saved: 4, count: '4 photos' },
  ])('counts $saved as "$count"', async ({ saved, count }) => {
    await showFavorites(of(batchOf(saved)));

    expect(find('h1')?.textContent).toContain(count);
  });
});
