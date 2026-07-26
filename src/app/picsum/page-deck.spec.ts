import { PageDeck } from './page-deck';

const PAGE_COUNT = 33;
const everyPage = Array.from({ length: PAGE_COUNT }, (_, index) => index + 1);

function draw(deck: PageDeck, times: number): number[] {
  return Array.from({ length: times }, () => deck.next());
}

describe('PageDeck', () => {
  it('draws every page exactly once per cycle', () => {
    const drawn = draw(new PageDeck(PAGE_COUNT), PAGE_COUNT);

    expect([...drawn].sort((a, b) => a - b)).toEqual(everyPage);
  });

  it('does not draw the pages in catalog order', () => {
    const drawn = draw(new PageDeck(PAGE_COUNT), PAGE_COUNT);

    expect(drawn).not.toEqual(everyPage);
  });

  it('starts a fresh full cycle once every page has been drawn', () => {
    const deck = new PageDeck(PAGE_COUNT);
    draw(deck, PAGE_COUNT);

    const secondCycle = draw(deck, PAGE_COUNT);

    expect([...secondCycle].sort((a, b) => a - b)).toEqual(everyPage);
  });

  it('never draws the same page twice in a row, including across a reshuffle', () => {
    const drawn = draw(new PageDeck(2), 40);

    expect(drawn.filter((page, index) => index > 0 && page === drawn[index - 1])).toEqual([]);
  });

  it('advances the cycle only once the whole deck has been drawn', () => {
    const deck = new PageDeck(PAGE_COUNT);

    draw(deck, PAGE_COUNT);

    expect(deck.cycle).toBe(0);

    deck.next();

    expect(deck.cycle).toBe(1);
  });

  it('keeps drawing the only page of a single-page deck', () => {
    const deck = new PageDeck(1);

    expect(draw(deck, 3)).toEqual([1, 1, 1]);
  });
});
