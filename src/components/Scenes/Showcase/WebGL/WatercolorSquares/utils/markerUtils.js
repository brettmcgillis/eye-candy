/**
 * Convert a UV position (0–1) to world space using the shorter viewport
 * dimension as the span. This keeps the marker grid proportional regardless
 * of aspect ratio — on a wide desktop the grid doesn't blow out horizontally.
 */
export function uvToConstrainedWorld(u, v, viewport) {
  const span = Math.min(viewport.width, viewport.height);
  return [(u - 0.5) * span, (v - 0.5) * span, 0.1];
}

/**
 * Convert a marker size value (in shader marker-space units, e.g. 0.05) to
 * world units. The shader always renders markers at viewport.height scale
 * after the aspect correction, so we use height here.
 */
export function markerWorldSize(uvSize, viewport) {
  return uvSize * viewport.height;
}
