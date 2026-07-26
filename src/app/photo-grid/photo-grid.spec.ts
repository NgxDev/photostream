import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FakeResizeObserver } from '../../fake-observers';
import { PhotoTile } from '../photo-tile/photo-tile';
import { Photo } from '../picsum/photo';
import { providePicsumImageLoader } from '../picsum/picsum-image-loader';
import { PhotoGrid } from './photo-grid';

const COLUMNS = 5;
const GRID_GAP = '14px';
const GRID_WIDTH = 1236;

function batchOf(size: number): Photo[] {
  return Array.from({ length: size }, (_, index) => {
    const id = String(index + 1);

    return { internalId: `${id}-0`, id, author: `Author ${id}`, width: 5000, height: 3333 };
  });
}

describe('PhotoGrid', () => {
  let fixture: ComponentFixture<PhotoGrid>;

  async function showGrid(photos: Photo[]): Promise<void> {
    TestBed.configureTestingModule({ providers: [providePicsumImageLoader()] });

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
});
