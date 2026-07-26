import { shuffle } from './shuffle';

export class PageDeck {
  private pages: readonly number[] = [];
  private cursor = 0;
  private lastDrawn: number | null = null;
  private passes = 0;

  constructor(private readonly pageCount: number) {}

  get cycle(): number {
    return this.passes;
  }

  next(): number {
    if (this.cursor >= this.pages.length) {
      if (this.pages.length > 0) {
        this.passes++;
      }

      this.pages = this.shuffledPages();
      this.cursor = 0;
    }

    const page = this.pages[this.cursor];

    this.cursor++;
    this.lastDrawn = page;

    return page;
  }

  private shuffledPages(): number[] {
    const pages = shuffle(Array.from({ length: this.pageCount }, (_, index) => index + 1));

    if (pages.length > 1 && pages[0] === this.lastDrawn) {
      const first = pages[0];

      pages[0] = pages[1];
      pages[1] = first;
    }

    return pages;
  }
}
