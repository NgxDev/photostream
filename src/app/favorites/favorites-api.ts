import { inject, Service } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { emulateLatency } from '../emulate-latency';
import { Photo } from '../picsum/photo';
import { BrowserStorage } from '../storage/browser-storage';

const STORAGE_KEY = 'photostream.favorites';

type StoredPhoto = Omit<Photo, 'internalId'>;

function isStoredPhoto(value: unknown): value is StoredPhoto {
  const photo = value as Partial<StoredPhoto> | null;

  return (
    typeof photo?.id === 'string' &&
    typeof photo.author === 'string' &&
    typeof photo.width === 'number' &&
    typeof photo.height === 'number'
  );
}

function toStoredPhoto({ id, author, width, height }: Photo): StoredPhoto {
  return { id, author, width, height };
}

function toPhoto(stored: StoredPhoto): Photo {
  return { internalId: stored.id, ...stored };
}

@Service()
export class FavoritesApi {
  private readonly storage = inject(BrowserStorage);

  read(): Observable<Photo[]> {
    return defer(() => of(this.storedPhotos().map(toPhoto))).pipe(emulateLatency());
  }

  add(photo: Photo): Observable<Photo> {
    return defer(() => {
      const stored = this.storedPhotos();
      const saved = toStoredPhoto(photo);

      if (!stored.some((entry) => entry.id === saved.id)) {
        this.storage.write(STORAGE_KEY, [saved, ...stored]);
      }

      return of(toPhoto(saved));
    }).pipe(emulateLatency());
  }

  remove(id: string): Observable<string> {
    return defer(() => {
      const stored = this.storedPhotos();
      const remaining = stored.filter((entry) => entry.id !== id);

      if (remaining.length !== stored.length) {
        this.storage.write(STORAGE_KEY, remaining);
      }

      return of(id);
    }).pipe(emulateLatency());
  }

  private storedPhotos(): StoredPhoto[] {
    const stored = this.storage.read<unknown>(STORAGE_KEY);

    return Array.isArray(stored) ? stored.filter(isStoredPhoto) : [];
  }
}
