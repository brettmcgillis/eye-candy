import { If, atan, clamp, cos, max, round, select, sin, vec2 } from 'three/tsl';

// Triangle cells' families (@modules/trucheterieBlob's triangle.js), in the
// same cell-local frame as blobArcs.js: micro-cell units about the centre of
// the cell's bounding box, y down. Type 4 is a fan of 60° arcs about a
// corner at (k + 1/2) / pathDiv; type 5 is rings about the centroid. The
// irregular families a bigger cell draws are type 6, a pocket of semicircles
// about a point on a side, and type 7, a bend: a fan reaching m.
const H = Math.sqrt(3) / 2;
const SIXTH = Math.PI / 6;
const TAN_SIXTH = Math.tan(SIXTH);

const pick3 = (index, values) =>
  select(
    index.equal(0),
    values[0],
    select(index.equal(1), values[1], values[2])
  );

function rotate(v, angle) {
  const c = cos(angle);
  const s = sin(angle);
  return vec2(v.x.mul(c).sub(v.y.mul(s)), v.x.mul(s).add(v.y.mul(c)));
}

export const triangleUp = (edge) => edge.div(3).floor().mod(2);

export function triangleCorner(corner, isUp, size) {
  const halfW = size.mul(0.5);
  const halfH = size.mul(H / 2);
  return vec2(
    select(
      isUp,
      pick3(corner, [0, halfW, halfW.negate()]),
      pick3(corner, [halfW.negate(), halfW, 0])
    ),
    select(
      isUp,
      pick3(corner, [halfH.negate(), halfH, halfH]),
      pick3(corner, [halfH.negate(), halfH.negate(), halfH])
    )
  );
}

function fanFamily(q, type, edge, size, pathDivU) {
  const corner = edge.mod(3).round();
  const up = triangleUp(edge);
  const isUp = up.greaterThan(0.5);
  const pivot = triangleCorner(corner, isUp, size);
  // Turned so the wedge spans ±30° about +x; its first edge (where `along`
  // reads 0) is at −30°.
  const middle = corner
    .mul((2 * Math.PI) / 3)
    .add(up.mul(Math.PI / 3))
    .add(SIXTH);
  const rel = rotate(q.sub(pivot), middle.negate());
  const inside = rel.y.abs().lessThanEqual(rel.x.mul(TAN_SIXTH));
  const side = select(rel.y.greaterThanEqual(0), 1, -1);
  const ray = vec2(Math.cos(SIXTH), side.mul(Math.sin(SIXTH)));
  const t = max(rel.dot(ray), 0);
  const clamped = select(inside, rel, ray.mul(t));
  const capOffset = rel.sub(clamped).length();

  const reach = select(edge.div(6).floor().mod(2).greaterThan(0.5), 0.75, 0.5);
  const reference = edge.greaterThanEqual(12);
  const rawCount = size
    .mul(pathDivU)
    .mul(reach)
    .add(select(reference, 0, 0.5))
    .floor()
    .add(select(reference, 1, 0));
  const fanCount = select(
    reference,
    rawCount.min(size.mul(pathDivU).mul(H).add(0.5).floor()),
    rawCount
  );
  const bands = select(
    type.equal(7),
    edge.div(6).floor().mul(pathDivU),
    fanCount
  ).max(1);
  const d = clamped.length();
  const k = clamp(round(d.mul(pathDivU).sub(0.5)), 0, bands.sub(1));
  const band = d.sub(k.add(0.5).div(pathDivU)).abs();
  const angle = atan(clamped.y, clamped.x);
  return {
    along: angle
      .add(SIXTH)
      .div(SIXTH * 2)
      .clamp(0, 1),
    aaField: d.add(capOffset),
    d,
    dBand: vec2(band, capOffset).length(),
    lane: clamp(d.mul(pathDivU).add(0.5).floor(), 0, bands.sub(1)),
    lanes: bands,
    rMin: select(reference, pathDivU.reciprocal().mul(0.5), 0),
    rMax: bands.sub(0.5).div(pathDivU),
    sweep: angle.abs().div(SIXTH).clamp(0, 1),
  };
}

function pocketFamily(q, edge, size, pathDivU) {
  const side = edge.mod(3).round();
  const up = triangleUp(edge);
  const isUp = up.greaterThan(0.5);
  const rest = edge.div(6).floor();
  const m = rest.div(512).floor();
  const offset2 = rest.sub(m.mul(512));
  const from = triangleCorner(side, isUp, size);
  const to = triangleCorner(side.add(1).mod(3), isUp, size);
  const center = from.add(to.sub(from).mul(offset2.mul(0.5).div(size)));
  // Turned so the semicircle opens towards +x; its first end is at −90°.
  const facing = side
    .mul((2 * Math.PI) / 3)
    .add(up.mul(Math.PI / 3))
    .add(Math.PI / 2);
  const rel = rotate(q.sub(center), facing.negate());
  const clamped = vec2(max(rel.x, 0), rel.y);
  const capOffset = rel.sub(clamped).length();

  const span = m.mul(pathDivU);
  const odd = select(span.mod(2).lessThan(0.5), 0.5, 0);
  const kMin = select(odd.greaterThan(0.25), 0, 1);
  const kMax = span.sub(1).mul(0.5).floor();
  const lanes = kMax.sub(kMin).add(1).max(1);
  const d = clamped.length();
  const k = clamp(round(d.mul(pathDivU).sub(odd)), kMin, kMax.max(kMin));
  const band = d.sub(k.add(odd).div(pathDivU)).abs();
  const angle = atan(clamped.y, clamped.x);
  return {
    along: angle
      .add(Math.PI / 2)
      .div(Math.PI)
      .clamp(0, 1),
    aaField: d.add(capOffset),
    d,
    dBand: vec2(band, capOffset).length(),
    lane: clamp(
      d.mul(pathDivU).sub(odd).floor().sub(kMin).add(1),
      0,
      lanes.sub(1)
    ),
    lanes,
    rMin: size.mul(0),
    rMax: kMax.add(odd).div(pathDivU),
    sweep: angle
      .abs()
      .div(Math.PI / 2)
      .clamp(0, 1),
  };
}

function ringsFamily(q, edge, size, pathDivU) {
  const up = triangleUp(edge);
  const center = vec2(
    0,
    up
      .mul(2)
      .sub(1)
      .mul(size)
      .mul(H / 6)
  );
  const rel = q.sub(center);
  const radius = size.div(4 * H);
  const bands = radius.mul(pathDivU).floor().max(1);
  const pitch = radius.div(bands).min(pathDivU.reciprocal());
  const d = rel.length();
  const k = clamp(round(d.div(pitch)), 1, bands);
  return {
    along: atan(rel.y, rel.x)
      .add(Math.PI)
      .div(Math.PI * 2)
      .clamp(0, 1),
    aaField: d,
    d,
    dBand: d.sub(k.mul(pitch)).abs(),
    lane: clamp(d.div(pitch).floor(), 0, bands.sub(1)),
    lanes: bands,
    rMin: size.mul(0),
    rMax: bands.mul(pitch),
    sweep: atan(rel.x, rel.y.negate()).abs().div(Math.PI),
  };
}

function returnFamily(q, type, edge, size, pathDiv) {
  const corner = edge.mod(3).round();
  const up = triangleUp(edge);
  const isUp = up.greaterThan(0.5);
  const turn = type.equal(10);
  const a = triangleCorner(corner, isUp, size);
  const b = triangleCorner(corner.add(1).mod(3), isUp, size);
  const pivot = select(turn, a, a.add(b).mul(0.5));
  const start = corner.mul((2 * Math.PI) / 3).add(up.mul(Math.PI / 3));
  const span = select(turn, Math.PI / 3, Math.PI);
  const middle = start.add(span.mul(0.5));
  const rel = rotate(q.sub(pivot), middle.negate());
  const half = span.mul(0.5);
  const ray = vec2(
    cos(half),
    select(rel.y.greaterThanEqual(0), 1, -1).mul(sin(half))
  );
  const inside = select(
    turn,
    rel.y.abs().lessThanEqual(rel.x.mul(TAN_SIXTH)),
    rel.x.greaterThanEqual(0)
  );
  const clamped = select(inside, rel, ray.mul(max(rel.dot(ray), 0)));
  const capOffset = rel.sub(clamped).length();
  const distance = clamped.length();
  const outer = select(turn, size, size.mul(0.5));
  const open = select(
    turn,
    clamped.x.mul(clamped.x).div(3).sub(clamped.y.mul(clamped.y)),
    size.mul(clamped.x)
  );
  const closed = select(
    turn,
    size.mul(size.mul(H).sub(clamped.x)),
    outer
      .sub(clamped.x.div(Math.sqrt(3)))
      .pow(2)
      .sub(clamped.y.mul(clamped.y))
  );
  const weight = open
    .mul(open)
    .div(open.mul(open).add(closed.mul(closed)).max(1e-20));
  const d = distance.add(outer.sub(distance).mul(weight));
  const n = size.mul(pathDiv).round();
  const odd = n.mod(2).greaterThan(0.5);
  const phase = select(turn.or(odd.not()), 0.5, 1);
  const bands = select(turn, n, n.mul(0.5).floor()).max(1);
  const k = clamp(round(d.mul(pathDiv).sub(phase)), 0, bands.sub(1));
  const radius = k.add(phase).div(pathDiv);
  const arcBand = vec2(d.sub(radius), capOffset).length();
  const inner = d.lessThan(pathDiv.reciprocal());
  const stemBand = max(rel.x.negate(), d.sub(pathDiv.reciprocal())).max(0);
  const stem = vec2(rel.y, stemBand).length();
  const withStem = select(
    turn.not().and(odd).and(inner),
    arcBand.min(stem),
    arcBand
  );
  const tiny = turn.not().and(n.equal(1));
  const bulb = rel.sub(vec2(size.mul(0.2), 0)).length();
  const angle = atan(clamped.y, clamped.x);
  return {
    along: angle.add(half).div(span).clamp(0, 1),
    aaField: select(tiny, bulb, d.add(capOffset)),
    d: select(tiny, bulb, d),
    dBand: select(tiny, bulb.sub(size.mul(0.2)).abs(), withStem),
    lane: clamp(d.mul(pathDiv).sub(phase).floor().add(1), 0, bands.sub(1)),
    lanes: bands,
    rMin: size.mul(0),
    rMax: select(tiny, size.mul(0.2), bands.sub(1).add(phase).div(pathDiv)),
    sweep: angle.abs().div(half).clamp(0, 1),
  };
}

export function triangleFamily(q, type, edge, size, pathDivU) {
  const fan = fanFamily(q, type, edge, size, pathDivU);
  const rings = ringsFamily(q, edge, size, pathDivU);
  const pocket = pocketFamily(q, edge, size, pathDivU);
  const isFan = type.equal(4).or(type.equal(7));
  const isPocket = type.equal(6);
  const result = Object.fromEntries(
    Object.keys(fan).map((key) => [
      key,
      select(
        isFan,
        fan[key],
        select(isPocket, pocket[key], rings[key])
      ).toVar(),
    ])
  );
  If(type.greaterThanEqual(9), () => {
    const returns = returnFamily(q, type, edge, size, pathDivU);
    Object.keys(result).forEach((key) => result[key].assign(returns[key]));
  });
  return result;
}

// Signed distance to the cell's triangle (negative inside), for the fill's
// footprint test. Measured for a down cell; an up cell mirrors y.
export function triangleDistance(q, size, edge) {
  const y = select(triangleUp(edge).greaterThan(0.5), q.y.negate(), q.y);
  const halfH = size.mul(H / 2);
  const top = y.add(halfH).negate();
  const slant = q.x
    .abs()
    .mul(2 * H)
    .add(y)
    .sub(halfH)
    .mul(0.5);
  return max(top, slant);
}
