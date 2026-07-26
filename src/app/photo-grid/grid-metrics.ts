import { TILE_ASPECT_RATIO } from '../picsum/picsum-urls';

export interface GridMetrics {
  readonly columns: number;
  readonly rowHeight: number;
}

/**
 * Virtual scroll needs the height of one row in pixels, and chunking photos into rows needs the
 * column count. Both come from the grid tokens plus the measured width, so the breakpoints stay in
 * CSS. Returns null until the grid has been laid out.
 */
export function gridMetrics(
  style: Pick<CSSStyleDeclaration, 'getPropertyValue'>,
  contentWidth: number
): GridMetrics | null {
  const columns = Number.parseInt(style.getPropertyValue('--ps-columns'), 10);
  const gap = Number.parseFloat(style.getPropertyValue('--ps-grid-gap'));

  if (!Number.isFinite(columns) || columns < 1 || !Number.isFinite(gap) || contentWidth <= 0) {
    return null;
  }

  const tileWidth = (contentWidth - gap * (columns - 1)) / columns;

  return { columns, rowHeight: Math.round(tileWidth / TILE_ASPECT_RATIO) + gap };
}
