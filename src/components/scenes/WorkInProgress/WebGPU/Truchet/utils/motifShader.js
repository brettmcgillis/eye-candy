import { Fn, attribute, frontFacing, mix, uv, vec2, vec4 } from 'three/tsl';

import clipAlpha from './clipMask';
import {
  arcSpineDistance,
  selectByIndex,
  solidBandMask,
  stripeMask,
} from './sdf';

// Each arc motif is a pair of quarter-circle spines, one per corner.
// Opposite-corner circles never overlap inside the tile (corner distance
// sqrt(2) > 2 * ARC_RADIUS), so `min`-combining their distance fields is a
// clean split with no seam artifacts.
const ARC_A_CORNERS = [
  [-0.5, -0.5],
  [0.5, 0.5],
];
const ARC_B_CORNERS = [
  [-0.5, 0.5],
  [0.5, -0.5],
];

function nearestArcDistance(p, corners) {
  return arcSpineDistance(p, corners[0]).min(arcSpineDistance(p, corners[1]));
}

export default function buildTruchetColorNode({
  bgColorU,
  borderInsetU,
  clipShapeU,
  fillModeU,
  fillWidthU,
  patternExtentU,
  pitchU,
  strokeColorU,
  strokeWidthU,
}) {
  return Fn(() => {
    // ySpin rotates a tile a full 180°, so for the second half of the flip
    // the camera sees what was the back face — mirror U back so the motif
    // reads correctly instead of flipped (same trick as ClothBills' bill
    // faces: mix(u.oneMinus(), u, frontFacing)).
    const correctedU = mix(uv().x.oneMinus(), uv().x, frontFacing);
    const p = vec2(correctedU, uv().y).sub(0.5);
    const motif = attribute('instanceMotif');

    const dArcA = nearestArcDistance(p, ARC_A_CORNERS);
    const dArcB = nearestArcDistance(p, ARC_B_CORNERS);
    const dStraightH = p.y.abs();
    const dStraightV = p.x.abs();
    const dSpine = selectByIndex(motif, [dArcA, dArcB, dStraightH, dStraightV]);

    // Both fields trace the same spine — line mode as repeated thin strokes,
    // solid mode as one continuous band — so they connect across tile edges
    // identically and switching fillMode never changes where the pattern
    // "is," only how thick it's drawn.
    const lineMask = stripeMask(dSpine, pitchU, strokeWidthU);
    const solidMask = solidBandMask(dSpine, fillWidthU);
    const finalMask = mix(lineMask, solidMask, fillModeU);

    clipAlpha({ borderInsetU, clipShapeU, patternExtentU })
      .lessThan(0.5)
      .discard();

    return vec4(mix(bgColorU, strokeColorU, finalMask), 1);
  })();
}
