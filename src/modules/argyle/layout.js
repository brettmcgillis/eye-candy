import { SQUARES_H } from '@utils/argylePattern';

function columnTiles(c) {
  const tiles = [];
  const pitch = 1.5 / Math.SQRT2;
  const angle = (c.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const half = (c.columns - 1) / 2;
  for (let row = 0; row < c.rows; row += 1) {
    const reach = Math.min(half, Math.min(row, c.rows - 1 - row) + (half % 1));
    for (let col = 0; col < c.columns; col += 1) {
      if (Math.abs(col - half) <= reach) {
        const x = (col - half) * pitch;
        const y = (row - (c.rows - 1) / 2) * pitch;
        tiles.push({
          x: x * cos + y * sin,
          y: -x * sin + y * cos,
          layer: (col + row + Math.floor(half)) % 2,
          col,
          row,
        });
      }
    }
  }
  return tiles;
}

export default function buildTiles(c) {
  if (c.pattern === 'logo')
    return SQUARES_H.map((s) => ({
      x: s.sx,
      y: -s.sy,
      layer: s.layer === 't' ? 1 : 0,
      col: s.i,
      row: 0,
    }));
  if (c.pattern === 'column') return columnTiles(c);
  const tiles = [];
  for (let layer = 0; layer < 2; layer += 1) {
    for (let row = 0; row < c.rows; row += 1) {
      for (let col = 0; col < c.columns; col += 1) {
        tiles.push({
          x: (col - (c.columns - 1) / 2) * 1.5 + layer * 0.75 - 0.375,
          y: (row - (c.rows - 1) / 2) * 1.5 + layer * 0.75 - 0.375,
          layer,
          col,
          row,
        });
      }
    }
  }
  return tiles;
}
