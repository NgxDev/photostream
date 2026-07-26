import { NgOptimizedImage } from '@angular/common';
import { afterNextRender, Component, ElementRef, input, linkedSignal, viewChild } from '@angular/core';
import { Photo } from '../picsum/photo';

@Component({
  selector: 'ps-photo-tile',
  imports: [NgOptimizedImage],
  template: `
    <img
      #image
      class="photo-tile__image"
      [ngSrc]="photo().id"
      height="600"
      sizes="(min-width: 900px) 20vw, (min-width: 600px) 33vw, 50vw"
      width="400"
      [alt]="'Photo by ' + photo().author"
      (load)="loaded.set(true)"
    />
  `,
  styleUrl: './photo-tile.scss',
  host: {
    '[class.ps-shimmer]': '!loaded()',
  },
})
export class PhotoTile {
  readonly photo = input.required<Photo>();

  protected readonly loaded = linkedSignal<Photo, boolean>({ source: this.photo, computation: () => false });

  private readonly image = viewChild.required<ElementRef<HTMLImageElement>>('image');

  constructor() {
    afterNextRender(() => {
      if (this.image().nativeElement.complete) {
        this.loaded.set(true);
      }
    });
  }
}
