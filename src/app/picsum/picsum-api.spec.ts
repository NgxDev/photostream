import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Photo } from './photo';
import { PicsumApi } from './picsum-api';

const LIST_URL = 'https://picsum.photos/v2/list';
const PAGE_SIZE = 30;
const PAGE_COUNT = 33;
const MIN_DELAY_MS = 200;
const MAX_DELAY_MS = 300;

function listItem(id: number) {
  return {
    id: String(id),
    author: `Author ${id}`,
    width: 5000,
    height: 3333,
    url: `https://unsplash.com/photos/${id}`,
    download_url: `https://picsum.photos/id/${id}/5000/3333`,
  };
}

const catalogPage = Array.from({ length: PAGE_SIZE }, (_, index) => listItem(index + 1));

describe('PicsumApi', () => {
  let api: PicsumApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(PicsumApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  function expectListRequest() {
    return httpMock.expectOne((request) => request.url === LIST_URL);
  }

  async function drawBatch(items = catalogPage) {
    let photos: Photo[] | undefined;
    api.loadMore().subscribe((batch) => (photos = batch));

    const request = expectListRequest();
    const page = Number(request.request.params.get('page'));

    request.flush(items);
    await vi.advanceTimersByTimeAsync(MAX_DELAY_MS);

    return { page, photos: photos ?? [] };
  }

  it('asks picsum for one catalog page of 30 photos', async () => {
    api.loadMore().subscribe();

    const request = expectListRequest();

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe(String(PAGE_SIZE));

    request.flush([]);
    await vi.advanceTimersByTimeAsync(MAX_DELAY_MS);
  });

  it('keeps only the fields every photo URL is derived from, plus a key for the stream', async () => {
    const { photos } = await drawBatch([listItem(7)]);

    expect(photos).toEqual([{ internalId: '7-0', id: '7', author: 'Author 7', width: 5000, height: 3333 }]);
  });

  it('keys a photo by which pass over the catalog delivered it', async () => {
    const firstPass = await drawBatch([listItem(7)]);

    for (let batch = 1; batch < PAGE_COUNT; batch++) {
      await drawBatch([listItem(7)]);
    }

    const secondPass = await drawBatch([listItem(7)]);

    expect(firstPass.photos[0].internalId).toBe('7-0');
    expect(secondPass.photos[0].internalId).toBe('7-1');
  });

  it('emits only once the emulated latency has elapsed', async () => {
    let photos: Photo[] | undefined;
    api.loadMore().subscribe((batch) => (photos = batch));
    expectListRequest().flush([listItem(1)]);

    await vi.advanceTimersByTimeAsync(MIN_DELAY_MS - 1);

    expect(photos).toBeUndefined();

    await vi.advanceTimersByTimeAsync(MAX_DELAY_MS - MIN_DELAY_MS + 1);

    expect(photos).toHaveLength(1);
  });

  it('reorders the photos within a batch so the stream does not run in catalog order', async () => {
    const { photos } = await drawBatch();
    const catalogOrder = catalogPage.map((item) => item.id);

    const ids = photos.map((photo) => photo.id);

    expect([...ids].sort()).toEqual([...catalogOrder].sort());
    expect(ids).not.toEqual(catalogOrder);
  });

  it('works through every catalog page before repeating one', async () => {
    const pages: number[] = [];

    for (let batch = 0; batch < PAGE_COUNT; batch++) {
      pages.push((await drawBatch()).page);
    }

    expect([...pages].sort((a, b) => a - b)).toEqual(Array.from({ length: PAGE_COUNT }, (_, i) => i + 1));
  });

  it('emits an empty batch when a page holds no photos', async () => {
    const { photos } = await drawBatch([]);

    expect(photos).toEqual([]);
  });
});
