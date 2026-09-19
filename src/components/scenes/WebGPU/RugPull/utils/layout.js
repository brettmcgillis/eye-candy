import {
  PI,
  abs,
  atan,
  cos,
  float,
  floor,
  fract,
  length,
  max,
  min,
  select,
  sin,
  step,
  uv,
  vec2,
} from 'three/tsl';

import { hash31 } from './patterns/shared';

const REFERENCE_HEIGHT = 5;
const FRINGE_CORD = 0.3;

export const REGION = { field: 0, border: 1, medallion: 2, guard: 3 };

export function textileRegions(u) {
  const q0 = uv().sub(0.5).mul(u.meshSize).toVar();
  const knotted = u.knotDensity.greaterThan(0);
  const knotCell = floor(q0.mul(u.knotDensity)).add(0.5).div(u.knotDensity);
  const q = select(knotted, knotCell, q0).toVar();
  const m = abs(q).toVar();
  const half = u.halfSize;
  const isRound = u.layout.equal(3);

  const edge = half.sub(m);
  const radius = length(q).toVar();
  const angle = atan(q.y, q.x).toVar();
  const d = select(isRound, half.x.sub(radius), min(edge.x, edge.y)).toVar();
  const along = abs(
    select(
      isRound,
      angle.mul(half.x),
      select(edge.x.lessThan(edge.y), q.y, q.x)
    )
  ).toVar();

  const g = u.guardWidth;
  const b = u.borderWidth;
  const fieldHalf = max(half.sub(g.mul(2).add(b)), vec2(0.001)).toVar();

  const kaleido = vec2(max(m.x, m.y), min(m.x, m.y));
  const fieldQ = select(
    u.symmetry.equal(0),
    q,
    select(u.symmetry.equal(1), m, kaleido)
  );

  const med = max(fieldHalf.mul(u.medallionSize), vec2(0.001)).toVar();
  const lozenge = select(
    isRound,
    radius.div(med.x),
    m.x.div(med.x).add(m.y.div(med.y))
  ).toVar();
  const cornerQ = abs(m.sub(fieldHalf)).toVar();
  const cornerShape = select(
    isRound,
    float(2),
    cornerQ.x.div(med.x).add(cornerQ.y.div(med.y))
  ).toVar();
  const hasMedallion = u.medallionSize.greaterThan(0);
  const rim = g.div(min(med.x, med.y));
  const medShape = min(lozenge, cornerShape).toVar();
  const inMedallion = hasMedallion.and(medShape.lessThan(1));
  const onRim = inMedallion.and(medShape.greaterThan(rim.oneMinus()));

  const sector = PI.mul(2).div(u.medallionPetals);
  const folded = abs(
    angle.sub(sector.mul(floor(angle.div(sector)))).sub(sector.div(2))
  );
  const medallionQ = select(
    lozenge.lessThan(cornerShape),
    vec2(cos(folded), sin(folded)).mul(radius),
    cornerQ
  );

  const borderQ = vec2(along, abs(d.sub(g).sub(b.div(2)))).mul(u.borderZoom);

  const isGuard = d
    .lessThan(g)
    .or(d.greaterThan(g.add(b)).and(d.lessThan(g.mul(2).add(b))))
    .or(onRim);
  const isBorder = d.lessThan(g.add(b));

  const region = select(
    isGuard,
    float(REGION.guard),
    select(
      isBorder,
      float(REGION.border),
      select(inMedallion, float(REGION.medallion), float(REGION.field))
    )
  ).toVar();

  const coord = select(
    isBorder,
    borderQ,
    select(inMedallion, medallionQ, fieldQ)
  ).mul(u.patternZoom.div(REFERENCE_HEIGHT));

  const stripe = step(0.5, fract(along.add(d).mul(u.guardFrequency)));

  const knotF = fract(q0.mul(u.knotDensity)).sub(0.5);
  const knotShade = select(
    knotted,
    knotF.dot(knotF).mul(2).mul(u.knotShade).oneMinus(),
    float(1)
  );

  return { along, coord, d, knotShade, q0, region, stripe };
}

export function fringe(u, q0) {
  const beyond = abs(q0.y).sub(u.halfSize.y);
  const t = beyond.div(max(u.fringeLength, 0.001));
  const strand = q0.x.mul(u.fringeDensity);
  const cordX = fract(strand).sub(0.5).abs();
  const reach = hash31(floor(strand)).x.mul(0.25).oneMinus();
  const alive = cordX
    .lessThan(FRINGE_CORD)
    .and(t.lessThan(reach))
    .and(abs(q0.x).lessThan(u.halfSize.x));

  return {
    alive,
    color: u.fringeColor.mul(cordX.div(FRINGE_CORD).mul(0.35).oneMinus()),
    inFringe: u.layout.equal(1).and(beyond.greaterThan(0)),
  };
}
