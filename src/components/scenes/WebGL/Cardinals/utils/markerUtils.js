/**
 * Convert a UV position (0–1) to world space using the full viewport
 * dimensions. Cardinals' corner markers should stay near the actual corners
 * of the screen at any aspect ratio.
 */
export function uvToWorld(u, v, viewport) {
  return [(u - 0.5) * viewport.width, (v - 0.5) * viewport.height, 0.1];
}

/**
 * Convert a marker size value (in shader marker-space units, e.g. 0.0375) to
 * world units. We base size on min(width, height) so squares appear square
 * at any aspect ratio.
 */
export function squareWorldSize(uvSize, viewport) {
  return uvSize * Math.min(viewport.width, viewport.height);
}
