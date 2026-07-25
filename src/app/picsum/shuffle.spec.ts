import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns every item exactly once', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    expect([...shuffle(items)].sort((a, b) => a - b)).toEqual(items);
  });

  it('does not mutate the input and returns a new array', () => {
    const items = [1, 2, 3, 4, 5];

    const shuffled = shuffle(items);

    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect(shuffled).not.toBe(items);
  });

  it('reorders the items', () => {
    const items = Array.from({ length: 20 }, (_, index) => index);

    expect(shuffle(items)).not.toEqual(items);
  });

  it('handles an empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles a single item', () => {
    expect(shuffle(['only'])).toEqual(['only']);
  });
});
