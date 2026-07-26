import { NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Photo } from '../picsum/photo';

export type PhotoTileMode = 'link' | 'save' | 'saving' | 'saved' | 'just-saved';

@Component({
  selector: 'ps-photo-tile',
  imports: [MatIcon, MatProgressSpinner, NgOptimizedImage, RouterLink],
  templateUrl: './photo-tile.html',
  styleUrl: './photo-tile.scss',
  host: {
    '[class.ps-shimmer]': '!loaded()',
  },
})
export class PhotoTile {
  readonly photo = input.required<Photo>();
  readonly priority = input(false, { transform: booleanAttribute });
  readonly mode = input<PhotoTileMode>('link');
  readonly save = output<Photo>();

  protected readonly loaded = linkedSignal<Photo, boolean>({ source: this.photo, computation: () => false });
  protected readonly isLink = computed(() => this.mode() === 'link');
  protected readonly canSave = computed(() => this.mode() === 'save');
  protected readonly showsBadge = computed(() => this.mode() === 'saved' || this.mode() === 'just-saved');
  protected readonly showsConfirmation = computed(() => this.mode() === 'just-saved');
  protected readonly showsOverlay = computed(() => this.mode() === 'saving' || this.showsConfirmation());

  protected readonly label = computed(() => {
    const author = this.photo().author;

    switch (this.mode()) {
      case 'save':
        return `Save photo by ${author} to favorites`;
      case 'saving':
        return `Saving photo by ${author} to favorites`;
      case 'saved':
      case 'just-saved':
        return `Photo by ${author}, saved to favorites`;
      default:
        return `Photo by ${author}`;
    }
  });

  private readonly image = viewChild.required<ElementRef<HTMLImageElement>>('image');

  constructor() {
    afterNextRender(() => {
      if (this.image().nativeElement.complete) {
        this.loaded.set(true);
      }
    });
  }

  protected requestSave(): void {
    if (this.canSave()) {
      this.save.emit(this.photo());
    }
  }
}
