import {
  Fn,
  attribute,
  float,
  instanceIndex,
  int,
  ivec2,
  max,
  mix,
  select,
  smoothstep,
  textureLoad,
  uv,
  vec2,
  vec4,
} from 'three/tsl';

import { arcFamily, sectorMask, strokeMask } from './blobArcs';
import { debugCellsMask, debugConnectorsMask } from './blobDebug';

// A family's lane index normalized to 0 (innermost ring) .. 1 (outermost),
// so `growthU` can gate it against a single 0..1 dial regardless of how many
// lanes this particular family happens to have.
function revealDepth(family) {
  return family.lane.div(max(family.lanes.sub(1), 1));
}

// A small, fixed falloff in normalized-depth space (not scaled by lane
// count): a family with few, wide lanes would otherwise need `growthU` well
// past 1 before its outermost ring stopped being partly transparent.
const GROWTH_AA = 0.04;

// 1 while a family's rings are within the grown fraction, falling smoothly
// to 0 just past it.
function growthMask(family, growthU) {
  return smoothstep(
    growthU.sub(GROWTH_AA),
    growthU.add(GROWTH_AA),
    revealDepth(family)
  ).oneMinus();
}

export default function buildBlobColorNode({
  cellSizeU,
  debugCellsU,
  debugConnectorsU,
  growthU,
  laneTexture,
  maxLanesU,
  pathDivU,
  penHalfWidthU,
  quadMarginU,
  referenceScaleU,
  showStrokesU,
  strokeColorU,
}) {
  return Fn(() => {
    const size = attribute('instanceSize');
    // Quads are inflated past the cell footprint by quadMargin so a stroke
    // meeting a cell edge can overhang it. Without that the quad slices the
    // pen in half exactly where an arc runs tangent to an edge, which reads
    // as a flat spot on an otherwise round curve.
    const extent = size.add(quadMarginU.mul(2));
    // Turtle canvases run y-down (@modules/trucheterieBlob's field.js negates
    // the instance's world y to match); flipping v here puts the pixel back
    // in that frame.
    const q = vec2(uv().x.sub(0.5), float(0.5).sub(uv().y)).mul(extent);

    const conn0 = attribute('instanceConn0', 'vec2');
    const conn1 = attribute('instanceConn1', 'vec2');
    const first = arcFamily(q, conn0.x, conn0.y, size, pathDivU);
    const second = arcFamily(q, conn1.x, conn1.y, size, pathDivU);
    const hasSecond = select(conn1.x.greaterThanEqual(0), 1, 0);

    // The reference registers each arc's pie sector as an occluder as it
    // draws, so the family drawn first hides the second wherever they
    // overlap — the hard terminations where two blobs meet. Within a family
    // the sectors nest, so nothing self-occludes.
    const outsideFirst = select(first.d.greaterThan(first.rMax), 1, 0);
    const firstGrown = growthMask(first, growthU);
    const secondGrown = growthMask(second, growthU);
    const ink = max(
      strokeMask(first.aaField, first.dBand, penHalfWidthU).mul(firstGrown),
      strokeMask(second.aaField, second.dBand, penHalfWidthU)
        .mul(outsideFirst)
        .mul(hasSecond)
        .mul(secondGrown)
    ).mul(showStrokesU);

    // The union of both families' sectors is the blob silhouette — the area
    // "inside the curves" that bgColor fills. Hard-clamped to the true
    // footprint (not the inflated quad) so adjacent cells' fills abut exactly
    // instead of overlapping into a darker seam.
    const inCell = select(
      max(q.x.abs(), q.y.abs()).lessThanEqual(size.mul(0.5)),
      1,
      0
    );
    const inBlob = max(
      sectorMask(first.d, first.rMax).mul(firstGrown),
      sectorMask(second.d, second.rMax).mul(hasSecond).mul(secondGrown)
    ).mul(inCell);

    // Lane fill. The winning family is the one whose sector owns this pixel —
    // the same rule the stroke occlusion uses — and its lane indexes a lookup
    // row built per cell by laneTexture.js. With no palette selected that
    // table is a single texel of the flat "tile background" colour, so there
    // is no branch here either way.
    const usesSecond = outsideFirst.mul(hasSecond);
    const laneSlot = usesSecond
      .mul(maxLanesU)
      .add(mix(first.lane, second.lane, usesSecond));
    const fill = textureLoad(
      laneTexture,
      ivec2(int(laneSlot), int(instanceIndex))
    ).rgb;

    // The debug hatch is specified in absolute units on the reference's own
    // canvas, so rescale this pixel's turtle-space position onto it.
    const canvasPoint = attribute('instanceCenter', 'vec2')
      .add(q.mul(cellSizeU))
      .mul(referenceScaleU);
    const cells = debugCellsMask(
      q,
      size,
      canvasPoint,
      penHalfWidthU,
      inCell.mul(inBlob.oneMinus())
    );
    const dots = debugConnectorsMask(
      q,
      size,
      attribute('instanceConnectors'),
      penHalfWidthU
    );

    const marks = max(
      ink,
      max(cells.mul(debugCellsU), dots.mul(debugConnectorsU))
    );

    return vec4(mix(fill, strokeColorU, marks), max(inBlob, marks));
  })();
}
