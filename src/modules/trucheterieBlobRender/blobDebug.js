import { clamp, dot, float, fract, max, round, select, vec2 } from 'three/tsl';

import { strokeMask, toCanonicalSide } from './blobArcs';

// The reference's `debug` control (None / Cells / Connections / Both). Cells
// draws each cell's outline plus its two hatchings; Connections marks the
// micro-positions along every still-active side, which is how you read the
// connectivity graph the packing produced.

// Hatch spacing and pen width are absolute distances on the reference's own
// 200-unit canvas, so the hatch works in those units (`canvasPoint`) rather
// than the micro-cell units the arcs and cell outlines use.
const HATCH_SPACING = 5;
const HATCH_ANGLES = [1, -1];
const HATCH_PEN_HALF = 0.125 / HATCH_SPACING;
const DOT_RADIUS = 0.05;
const DOT_INSET = 1 / 7;

// addHatching(angle, spacing) lays parallel lines whose offsets step along
// (sin a, cos a) at (k + 0.5) * spacing.
function hatchMask(canvasPoint, angle) {
  const axis = vec2(Math.sin(angle), Math.cos(angle));
  const t = dot(canvasPoint, axis).div(HATCH_SPACING);
  return strokeMask(t, fract(t.add(0.5)).sub(0.5).abs(), float(HATCH_PEN_HALF));
}

// The reference draws the cell outline straight to the turtle (never clipped,
// so it sits on top) but routes the hatching through the polygon clipper,
// which by then holds every arc sector already drawn. The hatching therefore
// shows only the cell's EMPTY area — pass that as `emptyMask`.
export function debugCellsMask(q, size, canvasPoint, penHalfWidthU, emptyMask) {
  const chebyshev = max(q.x.abs(), q.y.abs());
  const outline = strokeMask(
    chebyshev,
    chebyshev.sub(size.mul(0.5)).abs(),
    penHalfWidthU
  );
  const hatching = HATCH_ANGLES.reduce(
    (acc, angle) => max(acc, hatchMask(canvasPoint, angle)),
    float(0)
  );
  return max(outline, hatching.mul(emptyMask));
}

// One row of dots per active side, `size` of them, spaced one micro-cell
// apart and set slightly inside the edge — rotated a quarter turn per side,
// exactly as the reference walks its microConnectors array around the cell.
export function debugConnectorsMask(q, size, connectorMask, penHalfWidthU) {
  return [0, 1, 2, 3].reduce((acc, side) => {
    const active = connectorMask
      .div(2 ** side)
      .floor()
      .mod(2)
      .greaterThan(0.5);
    const c = toCanonicalSide(q, float(side));
    const dx = c.x.sub(size.mul(-0.5).add(0.5));
    const column = clamp(round(dx), 0, size.sub(1));
    const radial = vec2(
      dx.sub(column),
      c.y.sub(size.mul(-0.5).add(DOT_INSET))
    ).length();
    const ring = strokeMask(
      radial,
      radial.sub(DOT_RADIUS).abs(),
      penHalfWidthU
    );
    return max(acc, select(active, ring, 0));
  }, float(0));
}
