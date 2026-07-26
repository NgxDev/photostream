import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { MAX_LATENCY_MS, MIN_LATENCY_MS } from '../emulate-latency';
import { Photo } from '../picsum/photo';
import { BrowserStorage } from '../storage/browser-storage';
import { FavoritesApi } from './favorites-api';

const STORAGE_KEY = 'photostream.favorites';

function storedPhoto(id: string) {
  return { id, author: `Author ${id}`, width: 5000, height: 3333 };
}

function streamPhoto(id: string): Photo {
  return { internalId: `${id}-0`, ...storedPhoto(id) };
}

describe('FavoritesApi', () => {
  let api: FavoritesApi;
  let stored: unknown = null;
  let write = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    stored = null;
    write = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: BrowserStorage,
          useValue: { read: (key: string) => (key === STORAGE_KEY ? stored : null), write },
        },
      ],
    });

    api = TestBed.inject(FavoritesApi);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function response<T>(call: Observable<T>): Promise<T> {
    const value = firstValueFrom(call);

    await vi.advanceTimersByTimeAsync(MAX_LATENCY_MS);

    return value;
  }

  it('does not return the favorites until the emulated latency has elapsed', async () => {
    stored = [storedPhoto('7')];
    let photos: Photo[] | undefined;

    api.read().subscribe((next) => (photos = next));
    await vi.advanceTimersByTimeAsync(MIN_LATENCY_MS - 1);

    expect(photos).toBeUndefined();

    await vi.advanceTimersByTimeAsync(MAX_LATENCY_MS - MIN_LATENCY_MS + 1);

    expect(photos).toHaveLength(1);
  });

  it('returns every stored favorite in order, keyed by its picsum id', async () => {
    stored = [storedPhoto('9'), storedPhoto('7')];

    expect(await response(api.read())).toEqual([
      { internalId: '9', ...storedPhoto('9') },
      { internalId: '7', ...storedPhoto('7') },
    ]);
  });

  it('returns an empty list when nothing has been saved', async () => {
    expect(await response(api.read())).toEqual([]);
  });

  it('returns an empty list when the stored value is not an array', async () => {
    stored = { id: '7' };

    expect(await response(api.read())).toEqual([]);
  });

  it('ignores stored entries that are not photos', async () => {
    stored = [42, null, { id: '9' }, storedPhoto('7')];

    expect(await response(api.read())).toEqual([{ internalId: '7', ...storedPhoto('7') }]);
  });

  it('stores a new favorite at the front of the list, without the stream key', async () => {
    stored = [storedPhoto('1')];

    await response(api.add(streamPhoto('7')));

    expect(write).toHaveBeenCalledWith(STORAGE_KEY, [storedPhoto('7'), storedPhoto('1')]);
  });

  it('returns the saved photo keyed by its picsum id', async () => {
    expect(await response(api.add(streamPhoto('7')))).toEqual({ internalId: '7', ...storedPhoto('7') });
  });

  it('does not store a duplicate when the same photo is saved twice', async () => {
    stored = [storedPhoto('7')];

    await response(api.add(streamPhoto('7')));

    expect(write).not.toHaveBeenCalled();
  });

  it('stores the list without the photo that was removed', async () => {
    stored = [storedPhoto('9'), storedPhoto('7'), storedPhoto('1')];

    await response(api.remove('7'));

    expect(write).toHaveBeenCalledWith(STORAGE_KEY, [storedPhoto('9'), storedPhoto('1')]);
  });

  it('returns the id it removed', async () => {
    stored = [storedPhoto('7')];

    expect(await response(api.remove('7'))).toBe('7');
  });

  it('leaves the stored list alone when the id was never saved', async () => {
    stored = [storedPhoto('7')];

    await response(api.remove('9'));

    expect(write).not.toHaveBeenCalled();
  });
});
