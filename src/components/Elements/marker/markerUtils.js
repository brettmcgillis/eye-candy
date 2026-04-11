/**
 * Convert a UV position (0–1) to world space using the full viewport
 * dimensions. x=0.5, y=0.5 maps to world origin (0,0).
 */
export function uvToWorld(u, v, viewport) {
  return [(u - 0.5) * viewport.width, (v - 0.5) * viewport.height, 0.1];
}

/**
 * Convert a design-space position (0–1, height-normalised) to world space.
 * Both axes scale with viewport.height so the layout stays proportional
 * across any screen width.
 */
export function uvToConstrainedWorld(u, v, viewport) {
  return [(u - 0.5) * viewport.height, (v - 0.5) * viewport.height, 0.1];
}

/**
 * Convert a design-space position (height-normalised UV) to fluid simulation
 * UV space (0–1 mapped across the full screen width). Applies aspect-ratio
 * correction so fluid splats land at the same screen location as the geometry.
 */
export function designToFluidUV(u, v, viewport) {
  const aspectCorrection = viewport.height / viewport.width;
  return { x: (u - 0.5) * aspectCorrection + 0.5, y: v };
}

/**
 * Convert a marker size value (UV units) to world units using
 * min(viewport.width, viewport.height) so squares stay square.
 */
export function squareWorldSize(uvSize, viewport) {
  return uvSize * Math.min(viewport.width, viewport.height);
}

/**
 * Convert a marker size value (design-space units) to world units using
 * viewport.height for consistent sizing across aspect ratios.
 */
export function markerWorldSize(uvSize, viewport) {
  return uvSize * viewport.height;
}
