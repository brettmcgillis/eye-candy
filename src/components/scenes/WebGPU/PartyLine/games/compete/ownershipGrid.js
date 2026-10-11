/* eslint-disable no-param-reassign */
import { QUANT } from '../../utils/quantize';

export const ERASED = 0;

export function createGrid(size) {
  return { dirty: null, owners: new Uint8Array(size * size), size };
}

function markDirty(grid, x0, y0, x1, y1) {
  const d = grid.dirty;
  if (!d) {
    grid.dirty = { x0, x1, y0, y1 };
    return;
  }
  d.x0 = Math.min(d.x0, x0);
  d.y0 = Math.min(d.y0, y0);
  d.x1 = Math.max(d.x1, x1);
  d.y1 = Math.max(d.y1, y1);
}

export function stampCapsule(grid, ax, ay, bx, by, radius, owner) {
  const { owners, size } = grid;
  const minX = Math.max(0, Math.floor(Math.min(ax, bx) - radius));
  const maxX = Math.min(size - 1, Math.ceil(Math.max(ax, bx) + radius));
  const minY = Math.max(0, Math.floor(Math.min(ay, by) - radius));
  const maxY = Math.min(size - 1, Math.ceil(Math.max(ay, by) + radius));
  if (minX > maxX || minY > maxY) return;

  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const r2 = radius * radius;

  for (let y = minY; y <= maxY; y += 1) {
    const py = y + 0.5 - ay;
    for (let x = minX; x <= maxX; x += 1) {
      const px = x + 0.5 - ax;
      const t =
        len2 > 0 ? Math.min(1, Math.max(0, (px * dx + py * dy) / len2)) : 0;
      const ex = px - t * dx;
      const ey = py - t * dy;
      if (ex * ex + ey * ey <= r2) owners[y * size + x] = owner;
    }
  }
  markDirty(grid, minX, minY, maxX, maxY);
}

export function applyOp(grid, op) {
  const owner = op.k === 'e' ? ERASED : op.o;
  const scale = grid.size / QUANT;
  const { p, r } = op;
  if (p.length === 2) {
    stampCapsule(
      grid,
      p[0] * scale,
      p[1] * scale,
      p[0] * scale,
      p[1] * scale,
      r,
      owner
    );
    return;
  }
  for (let i = 2; i < p.length; i += 2) {
    stampCapsule(
      grid,
      p[i - 2] * scale,
      p[i - 1] * scale,
      p[i] * scale,
      p[i + 1] * scale,
      r,
      owner
    );
  }
}

export function countOwners(grid) {
  const counts = new Array(256).fill(0);
  grid.owners.forEach((owner) => {
    counts[owner] += 1;
  });
  return counts;
}
