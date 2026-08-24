/**
 * Convert a design-space position (0–1, height-normalised) to world space.
 * Both axes scale with viewport.height so the layout is proportional on any
 * screen width. x=0.5, y=0.5 maps to world origin (0,0).
 *
 * To align with the fluid simulation (which operates in full-viewport UV
 * space), use designToFluidUV before passing positions to the fluid sim.
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
 * Convert a marker size value (in design-space units, e.g. 0.09) to world
 * units. Uses viewport.height so size is consistent across aspect ratios.
 */
export function markerWorldSize(uvSize, viewport) {
  return uvSize * viewport.height;
}
