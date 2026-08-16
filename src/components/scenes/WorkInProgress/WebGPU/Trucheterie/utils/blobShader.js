import {
  Fn,
  attribute,
  float,
  max,
  mix,
  select,
  uv,
  vec2,
  vec4,
} from 'three/tsl';

import { arcFamily, sectorMask, strokeMask } from './blobArcs';
import { debugCellsMask, debugConnectorsMask } from './blobDebug';

export default function buildBlobColorNode({
  bgColorU,
  cellSizeU,
  debugCellsU,
  debugConnectorsU,
  pathDivU,
  penHalfWidthU,
  quadMarginU,
  referenceScaleU,
  strokeColorU,
}) {
  return Fn(() => {
    const size = attribute('instanceSize');
    // Quads are inflated past the cell footprint by quadMargin so a stroke
    // meeting a cell edge can overhang it. Without that the quad slices the
    // pen in half exactly where an arc runs tangent to an edge, which reads
    // as a flat spot on an otherwise round curve.
    const extent = size.add(quadMarginU.mul(2));
    // Turtle canvases run y-down (utils/blobField.js negates the instance's
    // world y to match); flipping v here puts the pixel back in that frame.
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
    const ink = max(
      strokeMask(first.d, first.dBand, penHalfWidthU),
      strokeMask(second.d, second.dBand, penHalfWidthU)
        .mul(select(first.d.greaterThan(first.rMax), 1, 0))
        .mul(hasSecond)
    );

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
      sectorMask(first.d, first.rMax),
      sectorMask(second.d, second.rMax).mul(hasSecond)
    ).mul(inCell);

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

    return vec4(mix(bgColorU, strokeColorU, marks), max(inBlob, marks));
  })();
}
