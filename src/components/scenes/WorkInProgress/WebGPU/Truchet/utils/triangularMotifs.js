import {
  Fn,
  attribute,
  frontFacing,
  mix,
  select,
  uv,
  vec2,
  vec4,
} from 'three/tsl';

import { clipAlpha, clipBorderMask } from './clipMask';
import {
  arcSpineDistance,
  segmentDistance,
  selectByIndex,
  solidBandMask,
  stripeMask,
} from './sdf';

// Every corner of an equilateral triangle is a valid arc center (all angles
// and adjacent edge lengths are equal), so unlike the square grid's fixed
// corner pair, a triangle tile has 3 possible arc orientations — plus a
// straight-chord variant of each — 0-2 = arc at v0/v1/v2, 3-5 = the matching
// straight chord between the same two edge midpoints.
//
// 6-11 are weave crossings: the triangle's three medians (vertex → opposite
// edge's midpoint) all pass through the centroid — which sits at the local
// origin, since the geometry is built centered on it (utils/triangleGeometry
// .js) — so any two medians cross exactly at p=(0,0). One motif per (pair,
// which median is under) combination; see grid.js's TRI_MOTIF for the
// encoding this selects by index.
function medianDistance(p, vertex, oppositeMidpoint) {
  return segmentDistance(p, vertex, oppositeMidpoint);
}

function gappedAtCentroid(p, dMedian, gapWidthU) {
  return select(p.length().lessThan(gapWidthU), 999, dMedian);
}

export default function buildTriangleColorNode({
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
  points,
  showGridLinesU,
  strokeColorU,
  strokeWidthU,
  weaveGapWidthU,
}) {
  const { m01, m12, m20, v0, v1, v2 } = points;

  return Fn(() => {
    const correctedU = mix(uv().x.oneMinus(), uv().x, frontFacing);
    const p = vec2(correctedU, uv().y).sub(0.5);
    const motif = attribute('instanceMotif');

    const dArc0 = arcSpineDistance(p, v0);
    const dArc1 = arcSpineDistance(p, v1);
    const dArc2 = arcSpineDistance(p, v2);
    const dStraight0 = segmentDistance(p, m01, m20);
    const dStraight1 = segmentDistance(p, m01, m12);
    const dStraight2 = segmentDistance(p, m12, m20);

    const dMed0 = medianDistance(p, v0, m12);
    const dMed1 = medianDistance(p, v1, m20);
    const dMed2 = medianDistance(p, v2, m01);
    const gapped0 = gappedAtCentroid(p, dMed0, weaveGapWidthU);
    const gapped1 = gappedAtCentroid(p, dMed1, weaveGapWidthU);
    const gapped2 = gappedAtCentroid(p, dMed2, weaveGapWidthU);

    const dSpine = selectByIndex(motif, [
      dArc0,
      dArc1,
      dArc2,
      dStraight0,
      dStraight1,
      dStraight2,
      gapped0.min(dMed1), // pair(0,1), 0 under
      dMed0.min(gapped1), // pair(0,1), 1 under
      gapped1.min(dMed2), // pair(1,2), 1 under
      dMed1.min(gapped2), // pair(1,2), 2 under
      gapped2.min(dMed0), // pair(2,0), 2 under
      dMed2.min(gapped0), // pair(2,0), 0 under
    ]);

    // Both fields trace the same spine — line mode as repeated thin strokes,
    // solid mode as one continuous band — so they connect across tile edges
    // identically and switching fillMode never changes where the pattern
    // "is," only how thick it's drawn.
    const lineMask = stripeMask(dSpine, pitchU, strokeWidthU);
    const solidMask = solidBandMask(dSpine, fillWidthU);
    const finalMask = mix(lineMask, solidMask, fillModeU);

    let color = mix(bgColorU, strokeColorU, finalMask);

    const dTileEdge = segmentDistance(p, v0, v1)
      .min(segmentDistance(p, v1, v2))
      .min(segmentDistance(p, v2, v0));
    const gridLineMask = solidBandMask(dTileEdge, gridLineWidthU).mul(
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
