import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { EmptyState } from '../../empty-state/empty-state';
import { pageTitle } from '../../page-title-strategy';
import { Photo } from '../../picsum/photo';
import { PICSUM_BREAKPOINTS } from '../../picsum/picsum-image-loader';
import { picsumImageUrl } from '../../picsum/picsum-urls';
import { FavoritesStore } from '../favorites-store';

export interface PhotoInFavorites {
  readonly photo: Photo;
  readonly counter: string;
  readonly previousId: string;
  readonly nextId: string;
  readonly alone: boolean;
}

export function photoInFavorites(favorites: readonly Photo[], id: string): PhotoInFavorites | null {
  const index = favorites.findIndex((favorite) => favorite.id === id);

  if (index === -1) {
    return null;
  }

  const previous = (index - 1 + favorites.length) % favorites.length;
  const next = (index + 1) % favorites.length;

  return {
    photo: favorites[index],
    counter: `${index + 1} / ${favorites.length}`,
    previousId: favorites[previous].id,
    nextId: favorites[next].id,
    alone: favorites.length === 1,
  };
}

export function stageSizes(photo: Photo): string {
  const ratio = Math.round((photo.width / photo.height) * 1000) / 1000;

  return `min(100vw, calc(100dvh * ${ratio}))`;
}

export function stageSrcset(photo: Photo): string {
  return PICSUM_BREAKPOINTS.map((width) => {
    const height = Math.round((width * photo.height) / photo.width);

    return `${picsumImageUrl(photo.id, width, height)} ${width}w`;
  }).join(', ');
}

@Component({
  selector: 'ps-photo-detail',
  imports: [EmptyState, MatButton, MatIcon, MatIconButton, MatProgressSpinner, RouterLink],
  templateUrl: './photo-detail.html',
  styleUrl: './photo-detail.scss',
})
export class PhotoDetail {
  readonly id = input.required<string>();

  protected readonly favorites = inject(FavoritesStore);
  protected readonly shown = computed(() => photoInFavorites(this.favorites.entities(), this.id()));
  protected readonly removing = computed(() => this.favorites.pendingIds().includes(this.id()));
  protected readonly loaded = linkedSignal<string, boolean>({ source: this.id, computation: () => false });
  protected readonly stageSizes = stageSizes;
  protected readonly stageSrcset = stageSrcset;

  private readonly pageName = computed(() => {
    const shown = this.shown();

    if (shown) {
      return `Photo by ${shown.photo.author}`;
    }

    return this.favorites.loaded() ? 'Photo not found' : 'Photo';
  });

  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly leaveFor = signal<{ removedId: string; commands: readonly string[] } | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const onKeydown = (event: KeyboardEvent): void => this.navigateOnArrowKeys(event);

      this.document.addEventListener('keydown', onKeydown);
      destroyRef.onDestroy(() => this.document.removeEventListener('keydown', onKeydown));
    });

    effect(() => this.title.setTitle(pageTitle(this.pageName())));

    effect(() => {
      const leaving = this.leaveFor();
      const favorites = this.favorites.entities();

      if (!leaving || favorites.some(({ id }) => id === leaving.removedId)) {
        return;
      }

      this.leaveFor.set(null);
      this.router.navigate(leaving.commands);
    });
  }

  remove(): void {
    const shown = this.shown();

    if (!shown) {
      return;
    }

    this.leaveFor.set({
      removedId: shown.photo.id,
      commands: shown.alone ? ['/favorites'] : ['/photos', shown.nextId],
    });
    this.favorites.remove(shown.photo.id);
  }

  private navigateOnArrowKeys(event: KeyboardEvent): void {
    const photoId = this.adjacentPhotoId(event.key);

    if (photoId === null || !this.cameFromThisPage(event.target)) {
      return;
    }

    event.preventDefault();
    this.router.navigate(['/photos', photoId]);
  }

  private adjacentPhotoId(key: string): string | null {
    const shown = this.shown();

    if (!shown || shown.alone) {
      return null;
    }

    if (key === 'ArrowLeft') {
      return shown.previousId;
    }

    if (key === 'ArrowRight') {
      return shown.nextId;
    }

    return null;
  }

  private cameFromThisPage(target: EventTarget | null): boolean {
    if (target === this.document.body) {
      return true;
    }

    return target instanceof Node && this.host.nativeElement.contains(target);
  }
}
