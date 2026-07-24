/**
 * Pin helpers for cloth simulation.
 *
 * Vertex IDs follow column-major order: id = x * (segmentsY + 1) + y
 * where x ∈ [0, segmentsX] and y ∈ [0, segmentsY].
 */

const vtxId = (x, y, segY) => x * (segY + 1) + y;

/**
 * Return vertex indices for an entire edge of the grid.
 * @param {'left'|'right'|'top'|'bottom'} edge
 * @param {number} segX - segmentsX
 * @param {number} segY - segmentsY
 * @returns {number[]}
 */
export function pinEdge(edge, segX, segY) {
  const ids = [];
  switch (edge) {
    case 'left':
      for (let y = 0; y <= segY; y += 1) ids.push(vtxId(0, y, segY));
      break;
    case 'right':
      for (let y = 0; y <= segY; y += 1) ids.push(vtxId(segX, y, segY));
      break;
    case 'top':
      for (let x = 0; x <= segX; x += 1) ids.push(vtxId(x, 0, segY));
      break;
    case 'bottom':
      for (let x = 0; x <= segX; x += 1) ids.push(vtxId(x, segY, segY));
      break;
    default:
      break;
  }
  return ids;
}

/**
 * Return the vertex index for a single grid point.
 * @param {number} x - Column index (0–segmentsX)
 * @param {number} y - Row index (0–segmentsY)
 * @param {number} segY - segmentsY
 * @returns {number[]}
 */
export function pinPoint(x, y, segY) {
  return [vtxId(x, y, segY)];
}

/**
 * Return vertex indices within a radius of a grid center point.
 * Coordinates are in grid space (0–segmentsX, 0–segmentsY).
 * @param {number} cx - Center column (can be fractional)
 * @param {number} cy - Center row (can be fractional)
 * @param {number} radius - Radius in grid units
 * @param {number} segX - segmentsX
 * @param {number} segY - segmentsY
 * @returns {number[]}
 */
export function pinRing(cx, cy, radius, segX, segY) {
  const ids = [];
  const r2 = radius * radius;
  for (let x = 0; x <= segX; x += 1) {
    for (let y = 0; y <= segY; y += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        ids.push(vtxId(x, y, segY));
      }
    }
  }
  return ids;
}
