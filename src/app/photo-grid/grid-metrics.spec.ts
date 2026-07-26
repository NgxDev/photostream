import { gridMetrics } from './grid-metrics';

function tokens(values: Partial<Record<string, string>>) {
  return { getPropertyValue: (name: string) => values[name] ?? '' };
}

describe('gridMetrics', () => {
  it.each([
    { columns: 2, gap: '10px', width: 362, rowHeight: 274 },
    { columns: 3, gap: '12px', width: 584, rowHeight: 292 },
    { columns: 5, gap: '14px', width: 1056, rowHeight: 314 },
  ])('measures a row of $columns tiles as $rowHeight tall', ({ columns, gap, width, rowHeight }) => {
    const metrics = gridMetrics(tokens({ '--ps-columns': String(columns), '--ps-grid-gap': gap }), width);

    expect(metrics).toEqual({ columns, rowHeight });
  });

  it.each<{ missing: string; values: Record<string, string> }>([
    { missing: 'column count', values: { '--ps-grid-gap': '10px' } },
    { missing: 'gap', values: { '--ps-columns': '2' } },
  ])('returns nothing when the $missing is not readable', ({ values }) => {
    expect(gridMetrics(tokens(values), 362)).toBeNull();
  });

  it('returns nothing before the grid has been laid out', () => {
    expect(gridMetrics(tokens({ '--ps-columns': '2', '--ps-grid-gap': '10px' }), 0)).toBeNull();
  });
});
