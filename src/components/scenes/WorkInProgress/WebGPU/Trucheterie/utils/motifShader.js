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
  lanesMask,
  motifMask,
  occludedMask,
  selectByIndex,
  solidBandMask,
} from './sdf';

// Each arc motif is a pair of quarter-circle spines, one per corner.
const ARC_A_CORNERS = [
  [-0.5, -0.5],
  [0.5, 0.5],
];
const ARC_B_CORNERS = [
  [-0.5, 0.5],
  [0.5, -0.5],
];

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
  layerBiasAmountU,
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
    const zBias = attribute('instanceZBias').mul(layerBiasAmountU);

    // Retile phase 0.5 is the intended-invisible edge-on instant (see
    // retileState.js's computeTileTransform) — on some mobile GPUs a
    // near-zero-width triangle there doesn't rasterize to nothing, it
    // smears the tile's own bgColor into a visible line right where tiles
    // meet. Discard outright instead of trusting the rasterizer.
    const animPhase = attribute('instanceAnimPhase');
    animPhase.sub(0.5).abs().lessThan(0.03).discard();

    // Multiscale leaves vary in world size (instanceScale, 1 for a
    // non-multiscale grid) but strokePitch/strokeWidth/etc. are UV
    // fractions — dividing by instanceScale keeps stroke density constant
    // in WORLD units instead of UV units, so a bigger leaf naturally shows
    // more rings and a smaller one fewer (the actual "multiscale" look).
    const instanceScale = attribute('instanceScale');
    const scaledPitchU = pitchU.div(instanceScale);
    const scaledStrokeWidthU = strokeWidthU.div(instanceScale);
    const scaledFillWidthU = fillWidthU.div(instanceScale);
    const scaledWeaveGapWidthU = weaveGapWidthU.div(instanceScale);
    const scaledGridLineWidthU = gridLineWidthU.div(instanceScale);

    const mm = (d) =>
      motifMask(
        d,
        scaledPitchU,
        scaledStrokeWidthU,
        scaledFillWidthU,
        fillModeU
      );
    const om = (d0, d1, bias) =>
      occludedMask(
        d0,
        d1,
        bias,
        scaledPitchU,
        scaledStrokeWidthU,
        scaledFillWidthU,
        fillModeU
      );
    const lm = (distances, primaryFlags) =>
      lanesMask(
        distances,
        primaryFlags,
        scaledPitchU,
        scaledStrokeWidthU,
        scaledFillWidthU,
        fillModeU
      );

    const dArcA0 = arcSpineDistance(p, ARC_A_CORNERS[0]);
    const dArcA1 = arcSpineDistance(p, ARC_A_CORNERS[1]);
    const dArcB0 = arcSpineDistance(p, ARC_B_CORNERS[0]);
    const dArcB1 = arcSpineDistance(p, ARC_B_CORNERS[1]);
    const dStraightH = p.y.abs();
    const dStraightV = p.x.abs();
    const dStraightHGapped = gappedStraightDistance(
      dStraightH,
      p.x,
      scaledWeaveGapWidthU
    );
    const dStraightVGapped = gappedStraightDistance(
      dStraightV,
      p.y,
      scaledWeaveGapWidthU
    );

    // Opposite corners' ring families are occluded, not unioned — whichever
    // corner is nearer (offset by the per-tile zBias for layering variety)
    // fully hides the other's ink, so each tile shows one corner's family
    // cleanly truncated instead of both crossing into a hatch (see sdf.js's
    // occludedMask).
    const maskArcA = om(dArcA0, dArcA1, zBias);
    const maskArcB = om(dArcB0, dArcB1, zBias);
    const maskStraightH = mm(dStraightH);
    const maskStraightV = mm(dStraightV);
    // Same occlusion logic as the arc pairs above: H and V are each a full
    // periodic line family spanning the whole tile, so max-ing their
    // independent masks shows both complete grids superimposed (a plaid),
    // not the nested diamond/chevron weave. occludedMask picks the nearer
    // axis's own clean stripe family, hard-cut at the tile diagonal — the
    // gap term still forces the "under" strand to lose right at the center
    // crossing regardless of which axis is geometrically nearer there.
    const maskCrossHUnder = om(dStraightHGapped, dStraightV, 0);
    const maskCrossVUnder = om(dStraightH, dStraightVGapped, 0);

    // LANES_A/LANES_B: all four corners' ring families visible at once
    // (both diagonals, not the either/or ARC_A/ARC_B pick above) — one
    // diagonal at full pitch density, the other 25% sparser.
    const cornerDistances = [dArcA0, dArcA1, dArcB0, dArcB1];
    const maskLanesA = lm(cornerDistances, [true, true, false, false]);
    const maskLanesB = lm(cornerDistances, [false, false, true, true]);

    const finalMask = selectByIndex(motif, [
      maskArcA,
      maskArcB,
      maskStraightH,
      maskStraightV,
      maskCrossHUnder,
      maskCrossVUnder,
      maskLanesA,
      maskLanesB,
    ]);

    let color = mix(bgColorU, strokeColorU, finalMask);

    const gridLineMask = solidBandMask(
      tileEdgeDistance(p),
      scaledGridLineWidthU
    ).mul(showGridLinesU);
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
