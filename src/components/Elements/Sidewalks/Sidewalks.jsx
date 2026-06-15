import React from 'react';

import Curb2 from '../Curb2/Curb2';
import Curb3 from '../Curb3/Curb3';
import Curb4 from '../Curb4/Curb4';
import Curb from '../Curb/Curb';
import Sidewalk2 from '../Sidewalk2/Sidewalk2';
import Sidewalk3 from '../Sidewalk3/Sidewalk3';
import Sidewalk4 from '../Sidewalk4/Sidewalk4';
import Sidewalk from '../Sidewalk/Sidewalk';
import SidewalkCornerSmall from '../SidewalkCornerSmall/SidewalkCornerSmall';
import SidewalkCornerSmallWalk from '../SidewalkCornerSmallWalk/SidewalkCornerSmallWalk';

// Assembled sidewalk block from the modular street kit. Every piece has a 2-unit
// "flat top" (the walkable square) plus a curb lip that hangs ~0.2 beyond the top
// on its outward side(s). We lay out a 4x4 grid of 2-unit cells centered at origin:
//
//        -X                      +X
//   -Z [ corner ][ edge ][ edge ][ corner ]   back  (-Z): plain corners
//      [ edge   ][ CURB ][ CURB ][ edge   ]
//      [ edge   ][ CURB ][ CURB ][ edge   ]
//   +Z [ ramp   ][ edge ][ edge ][ ramp   ]   front (+Z): corner-walk ramps
//
// The 2x2 center holds the 4 curb slabs, each squashed into a 2-unit square so the
// four together fill the 4x4 center exactly. Two edge pieces sit on each side
// between the corners. "Front" is +Z.
//
// Placement: GLB pivots are NOT centered, and the lip must overhang OUTWARD only —
// so we align each piece by its flat-top center (measured from the bbox, excluding
// the lip), not the bbox center. position = cell - R(rotY) * (scale * flatTopCenter)
// lands the 2-unit top exactly on the cell; lips then hang past the block edge.

const U = 2; // grid cell size = a piece's flat-top footprint

// Measured model-local FLAT-TOP centers (x, y, z). For the flat pieces the lip adds
// ~0.2 on one/two sides; the top center sits offset from the bbox center by that.
// (curb is treated as a plain slab and squashed by its full bbox.)
const FLAT_CENTER = {
  curb: [0.001, 0, -0.556], // squashed via CURB_SCALE; uses bbox center
  sidewalk: [0, 0, -0.553], // curb/lip on +Z
  cornerSmall: [0.091, 0, 0.134], // curbs on -X, -Z (flat top toward +X, +Z)
  cornerWalk: [0.126, 0, 0.156], // curbs on -X, -Z (flat top toward +X, +Z)
};

// Curb native footprint is 6.99 (x) x 5.901 (z); squash each into a 2-unit square
// (height kept) so a 2x2 of them fills the 4-unit center.
const CURB_SCALE = [2 / 6.99, 1, 2 / 5.901];

// Rotate an (x, z) offset about Y by theta.
function rotXZ(theta, x, z) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [x * c + z * s, -x * s + z * c];
}

// Lift the whole block so the pieces' lowest point (the curb base) rests on the
// group origin instead of straddling it — otherwise ~half the height sinks below
// the ground plane and the ramps clip. 0.085 = max |min-y| across the used pieces.
const LIFT = 0.085;

// Place a piece so its flat-top center lands on the given cell center.
function place([cx, cz], theta, center, scale = [1, 1, 1]) {
  const [ox, oz] = rotXZ(theta, center[0] * scale[0], center[2] * scale[2]);
  return {
    position: [cx - ox, LIFT, cz - oz],
    rotation: [0, theta, 0],
    scale,
  };
}

const A = U / 2; // 1 — inner ring coordinate (curb sub-cells + edge inner cells)
const B = (3 * U) / 2; // 3 — outer ring coordinate (corners + edge outer cells)

// The four curb slabs filling the 2x2 center (sub-cell centers at +/-1).
const CURBS = [
  { Comp: Curb, cell: [-A, -A] },
  { Comp: Curb2, cell: [A, -A] },
  { Comp: Curb3, cell: [-A, A] },
  { Comp: Curb4, cell: [A, A] },
];

// Two straight edge pieces per side, curb facing outward. Native curb is on +Z, so
// each side rotates to point its curb away from the center.
const EDGES = [
  { Comp: Sidewalk, cell: [-A, -B], theta: Math.PI }, // back  (-Z)
  { Comp: Sidewalk2, cell: [A, -B], theta: Math.PI },
  { Comp: Sidewalk3, cell: [B, -A], theta: Math.PI / 2 }, // right (+X)
  { Comp: Sidewalk4, cell: [B, A], theta: Math.PI / 2 },
  { Comp: Sidewalk, cell: [-A, B], theta: 0 }, // front (+Z)
  { Comp: Sidewalk2, cell: [A, B], theta: 0 },
  { Comp: Sidewalk3, cell: [-B, -A], theta: -Math.PI / 2 }, // left (-X)
  { Comp: Sidewalk4, cell: [-B, A], theta: -Math.PI / 2 },
];

// Corners: plain (CornerSmall, native front-left) at the back; ramps (CornerSmallWalk,
// native front-right) at the front. Rotations turn each native facing to its corner.
const CORNERS = [
  {
    Comp: SidewalkCornerSmall,
    cell: [-B, -B],
    theta: Math.PI * 2,
    c: 'cornerSmall',
  }, // back-left
  {
    Comp: SidewalkCornerSmall,
    cell: [B, -B],
    theta: -Math.PI / 2,
    c: 'cornerSmall',
  }, // back-right
  {
    Comp: SidewalkCornerSmallWalk,
    cell: [-B, B],
    theta: Math.PI / 2,
    c: 'cornerWalk',
  }, // front-left ramp
  {
    Comp: SidewalkCornerSmallWalk,
    cell: [B, B],
    theta: Math.PI,
    c: 'cornerWalk',
  }, // front-right ramp
];

export default function Sidewalks(props) {
  return (
    <group {...props} dispose={null}>
      {CURBS.map(({ Comp, cell }) => (
        <Comp
          key={`curb-${cell.join('_')}`}
          {...place(cell, 0, FLAT_CENTER.curb, CURB_SCALE)}
        />
      ))}
      {EDGES.map(({ Comp, cell, theta }) => (
        <Comp
          key={`edge-${cell.join('_')}`}
          {...place(cell, theta, FLAT_CENTER.sidewalk)}
        />
      ))}
      {CORNERS.map(({ Comp, cell, theta, c }) => (
        <Comp
          key={`corner-${cell.join('_')}`}
          {...place(cell, theta, FLAT_CENTER[c])}
        />
      ))}
    </group>
  );
}
