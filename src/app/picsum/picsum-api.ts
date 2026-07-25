import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { emulateLatency } from '../emulate-latency';
import { PageDeck } from './page-deck';
import { Photo } from './photo';
import { PICSUM_ORIGIN } from './picsum-urls';
import { shuffle } from './shuffle';

const LIST_URL = `${PICSUM_ORIGIN}/v2/list`;
const PAGE_SIZE = 30;
const FULL_PAGES_IN_CATALOG = 33;

interface PicsumListItem {
  id: string;
  author: string;
  width: number;
  height: number;
}

function toShuffledPhotos(items: PicsumListItem[]): Photo[] {
  return shuffle(items).map(({ id, author, width, height }) => ({ id, author, width, height }));
}

@Service()
export class PicsumApi {
  private readonly http = inject(HttpClient);
  private readonly deck = new PageDeck(FULL_PAGES_IN_CATALOG);

  nextBatch(): Observable<Photo[]> {
    const params = { page: this.deck.next(), limit: PAGE_SIZE };

    return this.http.get<PicsumListItem[]>(LIST_URL, { params }).pipe(emulateLatency(), map(toShuffledPhotos));
  }
}
