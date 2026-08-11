import {
  Fn,
  attribute,
  frontFacing,
  max,
  mix,
  select,
  uv,
  vec2,
  vec4,
} from 'three/tsl';

import { clipAlpha, clipBorderMask } from './clipMask';
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

// Weave crossing: both straight strands at once. The "gapped" one gets
// pushed to a distance far outside the stripe/band range right where it
// crosses the other strand (near the other strand's own line, i.e. where
// |the gapped axis| is small) — so it visually breaks there while the other
// strand draws through continuously, reading as passing under it.
function gappedStraightDistance(dStraight, gapAxis, gapWidthU) {
  return select(gapAxis.abs().lessThan(gapWidthU), 999, dStraight);
}

// Distance from p to the tile's own edge (the unit square boundary at
// |x|,|y| = 0.5) — same Chebyshev-distance idiom as clipMask.js's squareSDF,
// just centered on the tile instead of the whole pattern.
function tileEdgeDistance(p) {
  return max(p.x.abs(), p.y.abs()).sub(0.5).abs();
}

export default function buildTruchetColorNode({
  bgColorU,
  borderColorU,
  borderInsetU,
  borderThicknessU,
  borderVisibleU,
  clipCornerRadiusU,
  clipRotationU,
  clipShapeU,
  fillModeU,
  fillWidthU,
  gridLineColorU,
  gridLineWidthU,
  patternExtentU,
  pitchU,
  showGridLinesU,
  strokeColorU,
  strokeWidthU,
  weaveGapWidthU,
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
    const dCrossHUnder = gappedStraightDistance(
      dStraightH,
      p.x,
      weaveGapWidthU
    ).min(dStraightV);
    const dCrossVUnder = dStraightH.min(
      gappedStraightDistance(dStraightV, p.y, weaveGapWidthU)
    );
    const dSpine = selectByIndex(motif, [
      dArcA,
      dArcB,
      dStraightH,
      dStraightV,
      dCrossHUnder,
      dCrossVUnder,
    ]);

    // Both fields trace the same spine — line mode as repeated thin strokes,
    // solid mode as one continuous band — so they connect across tile edges
    // identically and switching fillMode never changes where the pattern
    // "is," only how thick it's drawn.
    const lineMask = stripeMask(dSpine, pitchU, strokeWidthU);
    const solidMask = solidBandMask(dSpine, fillWidthU);
    const finalMask = mix(lineMask, solidMask, fillModeU);

    let color = mix(bgColorU, strokeColorU, finalMask);

    const gridLineMask = solidBandMask(tileEdgeDistance(p), gridLineWidthU).mul(
      showGridLinesU
    );
    color = mix(color, gridLineColorU, gridLineMask);

    const clipParams = {
      borderInsetU,
      clipCornerRadiusU,
      clipRotationU,
      clipShapeU,
      patternExtentU,
    };
    const borderMask = clipBorderMask(clipParams, borderThicknessU).mul(
      borderVisibleU
    );
    color = mix(color, borderColorU, borderMask);

    clipAlpha(clipParams).lessThan(0.5).discard();

    return vec4(color, 1);
  })();
}
