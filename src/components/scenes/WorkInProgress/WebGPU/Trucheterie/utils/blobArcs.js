import { clamp, cos, round, select, sin, smoothstep, vec2 } from 'three/tsl';

// The reference's Cell.draw(), expressed as a distance field instead of
// polylines. Every length here is in MICRO-CELL units (one grid square = 1),
// which is what makes neighbouring cells line up: band radii land on the
// n/pathDiv lattice regardless of how many micro-cells a cell spans, so two
// cells sharing an edge always cross it at the same offsets.

const HALF_PI = Math.PI / 2;

// The reference rotates a canonical arc family by `edge` quarter turns
// (V.rot2d(edge * -PI/2), which V.trans applies as a +edge*PI/2 rotation).
// Sampling does the inverse, taking the pixel back to the canonical frame.
export function toCanonicalSide(q, edge) {
  const phi = edge.mul(-HALF_PI);
  const c = cos(phi);
  const s = sin(phi);
  return vec2(q.x.mul(c).sub(q.y.mul(s)), q.x.mul(s).add(q.y.mul(c)));
}

// One connection's concentric arc family:
//   type 0 (isolated cell) — full circles about the cell centre
//   type 1 (single side)   — semicircles about that side's midpoint
//   type 2 (corner turn)   — quarter arcs about the shared corner
// Types 0/1 step radii by (i + odd)/pathDiv and stop at half the cell; type 2
// steps by i/pathDiv from i=1 and reaches a FULL cell width, which is why a
// corner turn sweeps the whole cell while a stub only fills half of it.
//
// The reference strokes a polyline, so its ink is every point within a pen
// half-width of the arcs — which caps each arc ROUND at its endpoint. That
// distinction only bites because the quads are inflated past the cell
// footprint (utils/blobShader.js): measuring plain distance-to-circle out
// there continues the arc along its circle instead of stopping, laying a
// second stroke over the neighbouring cell's that curves away from it.
export function arcFamily(q, type, edge, size, pathDivU) {
  const isCorner = type.equal(2);
  const halfSize = size.mul(-0.5);
  const center = select(
    isCorner,
    vec2(halfSize, halfSize),
    select(type.equal(1), vec2(0, halfSize), vec2(0, 0))
  );

  const bands = size.mul(pathDivU);
  // The reference's `odd` half-step: with an odd band count it shifts the
  // family by half a pitch so the crossings stay on the shared lattice.
  const odd = select(
    isCorner,
    0,
    select(bands.mod(2).greaterThan(0.5), 0.5, 0)
  );
  const kMin = select(isCorner, 1, 0);
  const kMax = select(isCorner, bands, bands.mul(0.5).floor());
  const rMax = select(isCorner, size, size.mul(0.5));

  const rel = toCanonicalSide(q, edge).sub(center);
  // Clamp the sample back into the family's angular wedge (all / half /
  // quarter plane about its centre). Whatever gets clamped away is the
  // perpendicular distance past the arc's endpoint, and combining the two in
  // quadrature is exactly the pen's round cap.
  const clamped = select(
    type.equal(0),
    rel,
    select(
      isCorner,
      vec2(rel.x.max(0), rel.y.max(0)),
      vec2(rel.x, rel.y.max(0))
    )
  );
  const capOffset = rel.sub(clamped).length();

  const d = clamped.length();
  const k = clamp(round(d.mul(pathDivU).sub(odd)), kMin, kMax);
  const band = d.sub(k.add(odd).div(pathDivU)).abs();

  // The lane is the annulus BETWEEN two arcs, so it floors where the band
  // rounds. `laneBase` re-zeroes the odd half-step's inner disc, matching the
  // indexing utils/laneChannels.js assigns on the CPU.
  const laneBase = select(odd.greaterThan(0.25), 1, 0);
  const lanes = select(isCorner, bands, kMax.add(laneBase));
  const lane = clamp(
    d.mul(pathDivU).sub(odd).floor().add(laneBase),
    0,
    lanes.sub(1)
  );

  return {
    // Both terms are smooth, unlike dBand — see strokeMask.
    aaField: d.add(capOffset),
    d,
    dBand: vec2(band, capOffset).length(),
    lane,
    rMax,
  };
}

// Constant-width pen. `smoothField` must be the un-folded field `distance`
// was derived from: every one of these distances folds (at band midpoints,
// ring centres, hatch periods), and fwidth of a folded value spikes to the
// fold's full amplitude right where the line is, widening the AA band until
// the whole area reads as solid ink.
export function strokeMask(smoothField, distance, halfWidthU) {
  const aa = smoothField.fwidth().max(0.0001);
  return smoothstep(
    halfWidthU.sub(aa),
    halfWidthU.add(aa),
    distance
  ).oneMinus();
}

// A family's filled pie sector — the area its arcs sweep, and what the
// reference registers as an occluder. The union of a cell's two sectors is
// the blob silhouette: the region "inside the curves".
export function sectorMask(d, rMax) {
  const aa = d.fwidth().max(0.0001);
  return smoothstep(rMax.add(aa), rMax.sub(aa), d);
}
