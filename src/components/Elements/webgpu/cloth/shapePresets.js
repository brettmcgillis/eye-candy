/**
 * Shape presets for cloth simulation.
 *
 * Each function receives normalised UV coordinates (u, v ∈ [0, 1])
 * and returns a signed distance value:
 *   positive → inside the shape
 *   0        → on the boundary
 *   negative → outside the shape
 *
 * The distance is expressed in UV‑space units (1 = full grid span).
 */

/**
 * Rectangle — entire grid is the shape. Always returns positive.
 */
export function rectangle(u, v) {
  // Distance to nearest edge (all edges count)
  return Math.min(u, 1 - u, v, 1 - v);
}

/**
 * Circle (ellipse mapped to UV square → visual circle when aspect = 1,
 * squashed otherwise — caller should set width ≈ height for a true circle).
 */
export function circle(u, v) {
  const dx = u - 0.5;
  const dy = v - 0.5;
  return 0.5 - Math.sqrt(dx * dx + dy * dy);
}

/**
 * Ribbon with a notched / pennant tail ( ===< ).
 * The right edge has a V‑shaped notch cutting inward.
 *
 * @param {number} notchDepth — how far the notch cuts in (0–1, default 0.25)
 */
export function ribbonNotched(u, v, notchDepth = 0.25) {
  // Distance from the vertical centerline of the notch cut
  const vc = Math.abs(v - 0.5);
  // The notch boundary: at u=1 the notch is at its deepest,
  // linearly closing toward u = 1 - notchDepth.
  const notchStart = 1 - notchDepth;
  if (u >= notchStart) {
    // Inside the notch zone — boundary is a V from (notchStart, 0.5) to
    // (1, 0) and (1, 1).
    const t = (u - notchStart) / notchDepth; // 0 at start, 1 at tip
    const halfWidth = 0.5 * t; // V opens linearly
    return halfWidth - vc; // positive inside the V cut-out boundary inverted
    // Actually we want:  positive = cloth present.
    // The V removes material. So cloth is present where vc > halfWidth
    // (further from center than the V edge).
    // Revisit: the V cuts out the center, making a pennant tail.
  }
  // Left of notch zone — full rectangle applies
  return Math.min(u, v, 1 - v);
}

// Fix ribbonNotched: the notch removes a V from the right end.
// Cloth is present where: either we're left of the notch zone,
// or we're far enough from center that the V hasn't reached us.
// Re-implement cleanly:
/**
 * Ribbon-notched (cleaned up).  ===<
 * Cloth present everywhere except a V-notch cut from the right edge.
 */
export function ribbonNotchedSdf(u, v, notchDepth = 0.25) {
  const notchStart = 1 - notchDepth;
  const vc = Math.abs(v - 0.5); // 0 at center, 0.5 at top/bottom

  if (u <= notchStart) {
    // Left of notch — regular rectangle SDF (left, top, bottom edges)
    return Math.min(u, v, 1 - v);
  }

  // Inside notch zone.
  // The notch V goes from full-width at u = notchStart to zero-width at u = 1.
  // Half-height of the remaining cloth at this u:
  const t = (u - notchStart) / notchDepth; // 0→1
  const halfOpen = 0.5 * (1 - t); // 0.5→0
  // Cloth exists where |v - 0.5| > 0.5 * t  (outside the V)
  // SDF: distance from boundary
  const dNotch = vc - 0.5 * t; // positive = outside V = cloth present
  const dTop = v;
  const dBottom = 1 - v;
  return Math.min(dNotch, dTop, dBottom, halfOpen > 0 ? halfOpen : 0);
}

/**
 * Look up a shape function by name string.
 * @param {string} name — 'rectangle' | 'circle' | 'ribbon-notched'
 * @returns {function(u: number, v: number): number}
 */
export function getShape(name) {
  switch (name) {
    case 'circle':
      return circle;
    case 'ribbon-notched':
      return ribbonNotchedSdf;
    case 'rectangle':
    default:
      return rectangle;
  }
}
