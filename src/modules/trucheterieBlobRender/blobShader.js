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
// so growth can order rings regardless of how many this family has.
function revealDepth(family) {
  return family.lane.div(max(family.lanes.sub(1), 1));
}

// How much of `growthU`'s 0..1 timeline the front takes to cross the field;
// each cell spends the rest growing its own rings.
const FRONT_SPAN = 0.6;
// How much of a cell's own growth one ring spends sweeping from its midpoint
// to its ends; the rest staggers the rings inner to outer.
const RING_SWEEP = 0.45;
const GROWTH_AA = 0.03;

// 1 once this sample's ring has been drawn past it. A cell starts when the
// front reaches its delay; within it, each ring starts after the ones inside
// it and draws outward from its midpoint. `growthU` sits above 1 outside a
// growth video, which saturates every cell at fully grown.
function growthMask(family, growthU, delay) {
  const local = growthU
    .sub(delay.mul(FRONT_SPAN))
    .div(1 - FRONT_SPAN)
    .clamp(0, 1.5);
  const threshold = revealDepth(family)
    .mul(1 - RING_SWEEP)
    .add(family.sweep.mul(RING_SWEEP));
  return smoothstep(threshold.sub(GROWTH_AA), threshold.add(GROWTH_AA), local);
}

export default function buildBlobColorNode({
  cellSizeU,
  debugCellsU,
  debugConnectorsU,
  growthU,
  laneTextures,
  maxLanesU,
  pathDivU,
  penHalfWidthU,
  quadMarginU,
  referenceScaleU,
  showStrokesU,
  spectrumBlendU,
  spectrumPhaseU,
  spectrumU,
  stopCountU,
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
    const meta = attribute('instanceMeta', 'vec2');
    const delay = meta.y;
    const firstGrown = growthMask(first, growthU, delay);
    const secondGrown = growthMask(second, growthU, delay);
    const ink = max(
      strokeMask(first.aaField, first.dBand, penHalfWidthU).mul(firstGrown),
      strokeMask(second.aaField, second.dBand, penHalfWidthU)
        .mul(outsideFirst)
        .mul(hasSecond)
        .mul(secondGrown)
    ).mul(showStrokesU);

    // The union of both families' sectors is the blob silhouette — the area
    // "inside the curves" that the lane fill covers. Clamped to the cell's
    // footprint (not the inflated quad), plus half a pixel: an exact edge
    // lets a pixel centred on a shared edge fall just outside both cells
    // through rounding, which shows as a dotted background seam wherever
    // the grid is rotated. The fill is opaque and a lane's colour is
    // continuous across the edge, so the overlap never shows.
    const footprint = max(q.x.abs(), q.y.abs());
    const inCell = select(
      footprint.lessThanEqual(size.mul(0.5).add(footprint.fwidth().mul(0.5))),
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
    const slotCoord = ivec2(int(laneSlot), int(instanceIndex));
    const flatFill = textureLoad(laneTextures.colors, slotCoord).rgb;

    // Spectrum: the lane's distance along its whole channel picks a position
    // in the palette, offset per channel, wrapping last stop into first.
    const piece = textureLoad(laneTextures.along, slotCoord);
    const u = mix(first.along, second.along, usesSecond);
    const position = piece.w
      .add(piece.x.add(piece.y.mul(u)).mul(piece.z).mul(stopCountU))
      .add(spectrumPhaseU);
    const wrapped = position.sub(
      position.div(stopCountU).floor().mul(stopCountU)
    );
    const index = wrapped.floor();
    const next = select(
      index.add(1).greaterThanEqual(stopCountU),
      0,
      index.add(1)
    );
    const spectrum = mix(
      textureLoad(laneTextures.stops, ivec2(int(index), int(0))).rgb,
      textureLoad(laneTextures.stops, ivec2(int(next), int(0))).rgb,
      wrapped.sub(index).mul(spectrumBlendU)
    );
    const fill = mix(flatFill, spectrum, spectrumU);

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
    const dots = debugConnectorsMask(q, size, meta.x, penHalfWidthU);

    const marks = max(
      ink,
      max(cells.mul(debugCellsU), dots.mul(debugConnectorsU))
    );

    return vec4(mix(fill, strokeColorU, marks), max(inBlob, marks));
  })();
}
