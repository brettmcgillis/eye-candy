import { Fn, attribute, frontFacing, mix, uv, vec2, vec4 } from 'three/tsl';

import clipAlpha from './clipMask';
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
// straight-chord variant of each — for 6 motifs total: 0-2 = arc at
// v0/v1/v2, 3-5 = the matching straight chord between the same two edge
// midpoints.
export default function buildTriangleColorNode({
  bgColorU,
  borderInsetU,
  clipShapeU,
  fillModeU,
  fillWidthU,
  patternExtentU,
  pitchU,
  points,
  strokeColorU,
  strokeWidthU,
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
    const dSpine = selectByIndex(motif, [
      dArc0,
      dArc1,
      dArc2,
      dStraight0,
      dStraight1,
      dStraight2,
    ]);

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
