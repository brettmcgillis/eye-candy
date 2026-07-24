// Bridges screen-space window rects (as reported by useWindowSync) to the
// FlipFluid grid's local coordinate space, and enforces that water stays
// inside whatever screen area is currently covered by an alive window.
//
// Screen space: x right+, y DOWN+ (window.screenX/Y, matches DesktopStage).
// Grid-local space: x right+, y UP+ (matches the ported solver's convention
// of gravity being negative and pulling toward y = 0). `origin` is the
// world's screen-space anchor: its top-left corner plus total height, used
// to flip Y between the two spaces.
//
// applyWindowMask/confineToMask/seedParticles all mutate the FlipFluid
// instance's typed arrays in place by design — the whole point is avoiding
// per-frame allocation/copying of multi-thousand-element buffers.
/* eslint-disable no-continue, no-param-reassign */

export function screenToGridX(screenX, origin) {
  return screenX - origin.x;
}

export function screenToGridY(screenY, origin) {
  return origin.height - (screenY - origin.y);
}

export function gridToScreenX(gridX, origin) {
  return gridX + origin.x;
}

export function gridToScreenY(gridY, origin) {
  return origin.y + (origin.height - gridY);
}

const ORIGIN_MARGIN = 300;

// The grid's screen-space anchor is fixed for the solver's whole lifetime
// (cell indices would be meaningless if it moved), so it's chosen once, from
// wherever the alive windows happen to be when the sim (re)builds, padded by
// a margin so windows can drift a bit without falling outside the grid.
export function computeWorldOrigin(rects, worldHeight, margin = ORIGIN_MARGIN) {
  if (!rects.length) return { height: worldHeight, x: 0, y: 0 };

  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  return { height: worldHeight, x: minX - margin, y: minY - margin };
}

// Recomputes the solid mask every frame from live window rects: a cell is
// fluid-capable only if its center falls inside some alive window's rect.
// Outer border cells are always forced solid so the sim never reads/writes
// out of grid bounds.
export function applyWindowMask(fluid, rects, origin) {
  const n = fluid.fNumY;
  const { h } = fluid;

  for (let i = 0; i < fluid.fNumX; i += 1) {
    const border = i === 0 || i === fluid.fNumX - 1;
    for (let j = 0; j < fluid.fNumY; j += 1) {
      if (border || j === 0 || j === fluid.fNumY - 1) {
        fluid.s[i * n + j] = 0.0;
        continue;
      }

      const sx = gridToScreenX((i + 0.5) * h, origin);
      const sy = gridToScreenY((j + 0.5) * h, origin);
      let covered = false;
      for (let r = 0; r < rects.length; r += 1) {
        const rect = rects[r];
        if (
          sx >= rect.x &&
          sx <= rect.x + rect.w &&
          sy >= rect.y &&
          sy <= rect.y + rect.h
        ) {
          covered = true;
          break;
        }
      }
      fluid.s[i * n + j] = covered ? 1.0 : 0.0;
    }
  }
}

// Keeps water "confined to its tab" — the pressure solve alone only stops
// grid-velocity flow into solid cells, it doesn't retroactively correct a
// particle that already ended up in one. Two cases, in order:
//
// 1. The particle free-fell across a gap in one integration step but its
//    pre-integration cell is still covered → revert to that position and
//    kill velocity (the original behavior).
// 2. The particle is stranded: a window moved/resized away between frames,
//    so its previous position is uncovered too. Reverting would freeze it
//    midair wherever the window used to be — dragging a window would shed a
//    trail of frozen water instead of carrying it. Snap it to the nearest
//    point inside the nearest alive window instead, so the water follows
//    the windows.
export function confineToMask(fluid, prevX, prevY, rects, origin) {
  const n = fluid.fNumY;
  const invH = fluid.fInvSpacing;
  const { h } = fluid;
  // The snap inset must be at least one grid cell, not just the particle
  // radius: coverage is decided by cell centers, so a point closer than h to
  // a window edge can sit in a cell whose center is outside the rect — the
  // particle would land still-uncovered, get re-stranded, and re-snap to the
  // same spot every frame, welding a row of balls to the window edge.
  const pad = Math.max(fluid.particleRadius, h);

  for (let i = 0; i < fluid.numParticles; i += 1) {
    const x = fluid.particlePos[2 * i];
    const y = fluid.particlePos[2 * i + 1];
    const xi = Math.min(Math.max(Math.floor(x * invH), 0), fluid.fNumX - 1);
    const yi = Math.min(Math.max(Math.floor(y * invH), 0), fluid.fNumY - 1);
    if (fluid.s[xi * n + yi] !== 0.0) continue;

    const pxi = Math.min(
      Math.max(Math.floor(prevX[i] * invH), 0),
      fluid.fNumX - 1
    );
    const pyi = Math.min(
      Math.max(Math.floor(prevY[i] * invH), 0),
      fluid.fNumY - 1
    );

    if (fluid.s[pxi * n + pyi] !== 0.0 || !rects.length) {
      fluid.particlePos[2 * i] = prevX[i];
      fluid.particlePos[2 * i + 1] = prevY[i];
      fluid.particleVel[2 * i] = 0;
      fluid.particleVel[2 * i + 1] = 0;
      continue;
    }

    const sx = gridToScreenX(x, origin);
    const sy = gridToScreenY(y, origin);
    let bestD2 = Infinity;
    let bestX = sx;
    let bestY = sy;
    for (let r = 0; r < rects.length; r += 1) {
      const rect = rects[r];
      // A window thinner than 2*pad has no insettable interior — fall back
      // to its centerline rather than clamping against inverted bounds.
      const cx =
        rect.w > 2 * pad
          ? Math.min(Math.max(sx, rect.x + pad), rect.x + rect.w - pad)
          : rect.x + rect.w / 2;
      const cy =
        rect.h > 2 * pad
          ? Math.min(Math.max(sy, rect.y + pad), rect.y + rect.h - pad)
          : rect.y + rect.h / 2;
      const dx = cx - sx;
      const dy = cy - sy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestX = cx;
        bestY = cy;
      }
    }

    // A window dragged outside the grid's fixed footprint can produce a
    // snap target beyond the solver's bounds — clamp into the grid interior
    // so cell indexing stays valid either way.
    fluid.particlePos[2 * i] = Math.min(
      Math.max(screenToGridX(bestX, origin), h),
      (fluid.fNumX - 1) * h
    );
    fluid.particlePos[2 * i + 1] = Math.min(
      Math.max(screenToGridY(bestY, origin), h),
      (fluid.fNumY - 1) * h
    );
    fluid.particleVel[2 * i] = 0;
    fluid.particleVel[2 * i + 1] = 0;
  }
}

// Dam-break seed: fills a block of particles into the topmost currently-alive
// window's rect, so newly (re)started fluid drops in from wherever the
// highest window on screen currently is.
export function seedParticles(fluid, rects, origin, count) {
  if (!rects.length) return;

  const topRect = rects.reduce((top, r) => (r.y < top.y ? r : top), rects[0]);
  const r = fluid.particleRadius;
  const dx = 2.0 * r;
  const dy = (Math.sqrt(3.0) / 2.0) * dx;

  const gx0 = screenToGridX(topRect.x, origin) + r;
  const gy1 = screenToGridY(topRect.y, origin) - r;

  const numX = Math.max(1, Math.floor((topRect.w - 2 * r) / dx));
  const numY = Math.max(1, Math.ceil(count / numX));

  fluid.numParticles = 0;
  let p = 0;
  for (let j = 0; j < numY && fluid.numParticles < count; j += 1) {
    for (
      let i = 0;
      i < numX &&
      fluid.numParticles < count &&
      fluid.numParticles < fluid.maxParticles;
      i += 1
    ) {
      fluid.particlePos[p] = gx0 + dx * i + (j % 2 === 0 ? 0.0 : r);
      fluid.particlePos[p + 1] = gy1 - dy * j;
      fluid.particleVel[p] = 0;
      fluid.particleVel[p + 1] = 0;
      p += 2;
      fluid.numParticles += 1;
    }
  }
  fluid.particleRestDensity = 0.0;
}
