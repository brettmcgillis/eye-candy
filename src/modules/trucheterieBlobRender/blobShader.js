import {
  Fn,
  If,
  attribute,
  float,
  instanceIndex,
  int,
  ivec2,
  max,
  mix,
  select,
  textureLoad,
  uv,
  vec2,
  vec4,
} from 'three/tsl';

import { arcFamily, sectorMask, strokeMask } from './blobArcs';
import { debugCellsMask, debugConnectorsMask } from './blobDebug';
import capColor from './capShader';
import { growthMask, revealDepth } from './growth';
import { isReturn, triangleDistance } from './triangleArcs';

export default function buildBlobColorNode({
  painting,
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
    const conn0 = attribute('instanceConn0', 'vec2');
    const conn1 = attribute('instanceConn1', 'vec2');
    // Quads are inflated past the cell footprint by quadMargin so a stroke
    // meeting a cell edge can overhang it. Without that the quad slices the
    // pen in half exactly where an arc runs tangent to an edge, which reads
    // as a flat spot on an otherwise round curve.
    const extent = size.add(quadMarginU.mul(2));
    // Turtle canvases run y-down (@modules/trucheterieBlob's field.js negates
    // the instance's world y to match); flipping v here puts the pixel back
    // in that frame.
    const q = vec2(uv().x.sub(0.5), float(0.5).sub(uv().y)).mul(extent);

    const result = vec4(0).toVar();
    If(conn0.x.equal(12), () => {
      result.assign(
        capColor(
          q,
          {
            laneTextures,
            pathDivU,
            penHalfWidthU,
            showStrokesU,
            strokeColorU,
            maxLanesU,
            spectrumU,
            spectrumBlendU,
            spectrumPhaseU,
            stopCountU,
            growthU,
          },
          attribute('instanceMeta', 'vec2').y
        )
      );
    }).Else(() => {
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
      const firstGrown = growthMask(
        first,
        growthU,
        delay,
        select(conn0.x.equal(8), meta.x, revealDepth(first))
      );
      const secondGrown = growthMask(second, growthU, delay);
      const returnFootprint = triangleDistance(q, size, conn0.y);
      const returnInk = select(
        returnFootprint.lessThanEqual(returnFootprint.fwidth().mul(0.5)),
        1,
        0
      );
      const penPoint = attribute('instanceCenter', 'vec2').add(
        q.mul(cellSizeU)
      );
      const penWave = painting
        .grainAt(penPoint.mul(1.7), float(976))
        .sub(0.5)
        .mul(painting.u.strokeRoughness)
        .mul(painting.u.style.greaterThan(0.5).select(1, 0));
      const penWidth = penHalfWidthU.mul(penWave.mul(0.9).add(1));
      const ink = max(
        strokeMask(
          first.aaField,
          first.dBand.add(penWave.mul(penHalfWidthU)),
          penWidth
        ).mul(firstGrown),
        strokeMask(
          second.aaField,
          second.dBand.add(penWave.mul(penHalfWidthU)),
          penWidth
        )
          .mul(outsideFirst)
          .mul(hasSecond)
          .mul(secondGrown)
      )
        .mul(showStrokesU)
        .mul(select(isReturn(conn0.x), returnInk, 1));

      // The union of both families' sectors is the blob silhouette — the area
      // "inside the curves" that the lane fill covers. Clamped to the cell's
      // footprint (not the inflated quad), plus half a pixel: an exact edge
      // lets a pixel centred on a shared edge fall just outside both cells
      // through rounding, which shows as a dotted background seam wherever
      // the grid is rotated. The fill is opaque and a lane's colour is
      // continuous across the edge, so the overlap never shows.
      const footprint = max(q.x.abs(), q.y.abs());
      const inSquare = footprint.lessThanEqual(
        size.mul(0.5).add(footprint.fwidth().mul(0.5))
      );
      const toTriangle = triangleDistance(q, size, conn0.y);
      const inTriangle = toTriangle.lessThanEqual(toTriangle.fwidth().mul(0.5));
      const isTriangle = conn0.x.greaterThanEqual(4).and(conn0.x.notEqual(8));
      const inCell = select(select(isTriangle, inTriangle, inSquare), 1, 0);
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

      // The debug overlay draws square cells' outlines and side connectors.
      const debugOn = select(conn0.x.greaterThanEqual(4), 0, 1);
      const marks = max(
        ink,
        max(cells.mul(debugCellsU), dots.mul(debugConnectorsU)).mul(debugOn)
      );

      // A triangle fan's round cap overhangs onto its neighbour's arc of the
      // same circle; tinting its antialiased rim with this cell's fill there
      // leaves a notch at every seam, so outside the cell a mark is pure ink.
      const inkOnly = isTriangle
        .and(inCell.lessThan(0.5))
        .and(marks.greaterThan(0.001));
      const legacyIdentity = instanceIndex
        .toVarying()
        .toUint()
        .shiftLeft(16)
        .bitOr(laneSlot.toUint());
      const nativeIdentity = textureLoad(
        laneTextures.paint,
        slotCoord
      ).r.toUint();
      const fillIdentity = select(
        painting.u.bleed.add(painting.u.pooling).greaterThan(0.001),
        nativeIdentity,
        legacyIdentity
      );
      const paintedFill = painting.treat(fill, canvasPoint.mul(0.017), {
        seed: fillIdentity,
        edge: ink,
      });
      const drawnInk = painting.u.style
        .greaterThan(0.5)
        .select(painting.inkFor(fill), strokeColorU);
      const tooth = painting.sample(canvasPoint.mul(0.06)).g.mul(0.5).add(0.5);
      const drawnMarks = select(inkOnly, 1, marks).mul(
        painting.u.style.greaterThan(0.5).select(tooth, 1)
      );
      const tone = mix(paintedFill, drawnInk, drawnMarks);
      result.assign(vec4(tone, max(inBlob, marks)));
    });
    return result;
  })();
}
