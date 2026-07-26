import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { FakeResizeObserver } from '../../fake-observers';
import { PhotoTile } from '../photo-tile/photo-tile';
import { Photo } from '../picsum/photo';
import { providePicsumImageLoader } from '../picsum/picsum-image-loader';
import { PhotoGrid } from './photo-grid';

const COLUMNS = 5;
const GRID_GAP = '14px';
const GRID_WIDTH = 1236;
const ROW_HEIGHT = 368;

function batchOf(size: number): Photo[] {
  return Array.from({ length: size }, (_, index) => {
    const id = String(index + 1);

    return { internalId: `${id}-0`, id, author: `Author ${id}`, width: 5000, height: 3333 };
  });
}

describe('PhotoGrid', () => {
  let fixture: ComponentFixture<PhotoGrid>;

  async function showGrid(photos: Photo[]): Promise<void> {
    TestBed.configureTestingModule({ providers: [providePicsumImageLoader(), provideRouter([])] });

    fixture = TestBed.createComponent(PhotoGrid);
    fixture.componentRef.setInput('photos', photos);
    await fixture.whenStable();
  }

  async function measureAt(width: number): Promise<void> {
    const host = fixture.nativeElement as HTMLElement;

    host.style.setProperty('--ps-columns', String(COLUMNS));
    host.style.setProperty('--ps-grid-gap', GRID_GAP);
    FakeResizeObserver.latest?.resizeTo(width);

    await fixture.whenStable();
  }

  function renderedRows(): string[][] {
    return fixture.debugElement
      .queryAll(By.css('.photo-grid__row'))
      .map((row) =>
        row.queryAll(By.directive(PhotoTile)).map((tile) => (tile.componentInstance as PhotoTile).photo().id)
      );
  }

  function renderedModes(): string[] {
    return fixture.debugElement
      .queryAll(By.directive(PhotoTile))
      .map((tile) => (tile.componentInstance as PhotoTile).mode());
  }

  afterEach(() => {
    FakeResizeObserver.latest = undefined;
  });

  it('lays the photos out in rows as wide as the grid, keeping their order', async () => {
    await showGrid(batchOf(7));
    await measureAt(GRID_WIDTH);

    expect(renderedRows()).toEqual([
      ['1', '2', '3', '4', '5'],
      ['6', '7'],
    ]);
  });

  it('renders nothing until it has measured how tall a row is', async () => {
    await showGrid(batchOf(7));

    expect(renderedRows()).toEqual([]);
  });

  it('is as tall as the rows it holds', async () => {
    await showGrid(batchOf(7));
    await measureAt(GRID_WIDTH);

    expect((fixture.nativeElement as HTMLElement).style.minHeight).toBe(`${2 * ROW_HEIGHT}px`);
  });

  it('opens the photo page on the favorites grid', async () => {
    await showGrid(batchOf(3));
    await measureAt(GRID_WIDTH);

    expect(renderedModes()).toEqual(['link', 'link', 'link']);
  });

  it('shows which photos are saved and which are still saving', async () => {
    await showGrid(batchOf(4));
    fixture.componentRef.setInput('saveState', {
      ids: new Set(['2', '3']),
      pending: new Set(['1']),
      justSaved: '3',
    });
    await measureAt(GRID_WIDTH);

    expect(renderedModes()).toEqual(['saving', 'saved', 'just-saved', 'save']);
  });

  it('reports which photo was clicked to save', async () => {
    const saved: Photo[] = [];

    await showGrid(batchOf(1));
    fixture.componentRef.setInput('saveState', { ids: new Set(), pending: new Set(), justSaved: null });
    await measureAt(GRID_WIDTH);
    fixture.componentInstance.save.subscribe((photo) => saved.push(photo));

    fixture.nativeElement.querySelector('.photo-tile__control').click();

    expect(saved.map(({ id }) => id)).toEqual(['1']);
  });
});
