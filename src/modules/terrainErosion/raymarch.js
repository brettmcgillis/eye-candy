import {
  Break,
  If,
  Loop,
  float,
  int,
  select,
  step,
  vec2,
  vec3,
} from 'three/tsl';

import { M_GROUND, M_STRATA, M_WATER } from './constants';

const MISS = -1;

// From https://iquilezles.org/articles/intersectors. `range` is (near, far) or
// (-1, -1) on a miss, and `normal` is the face the near hit landed on.
export function boxIntersection(ro, rd, boxSize) {
  const m = rd.reciprocal().toVar();
  const n = m.mul(ro).toVar();
  const k = m.abs().mul(boxSize).toVar();

  const t1 = n.negate().sub(k).toVar();
  const t2 = n.negate().add(k).toVar();

  const near = t1.x.max(t1.y).max(t1.z).toVar();
  const far = t2.x.min(t2.y).min(t2.z).toVar();
  const missed = near.greaterThan(far).or(far.lessThan(0)).toVar();

  const normal = rd
    .sign()
    .negate()
    .mul(step(t1.yzx, t1.xyz))
    .mul(step(t1.zxy, t1.xyz));

  return {
    missed,
    normal,
    range: select(missed, vec2(MISS), vec2(near, far)),
  };
}

// Fewes' terrain march (https://www.shadertoy.com/view/7ljcRW): accelerate by
// the altitude above the heightfield, then halve the step and walk back the
// moment the ray goes under. The refinement is what makes the acceleration
// safe — without it the long steps alias badly on grazing rays.
//
// `proximity` is the running minimum of altitude over distance, which the caller
// reuses as a free soft-shadow and horizon term.
export default function march({
  boxSize,
  heightAt,
  quality = 2,
  ro,
  rd,
  waterEnabled,
  waterHeight,
}) {
  const samples = Math.max(1, Math.round(48 * quality));

  const box = boxIntersection(ro, rd, boxSize);
  const tStart = box.range.x.max(0).add(1e-2).toVar();
  const tEnd = box.range.y.sub(1e-2).toVar();

  const proximity = float(9999).toVar();
  const material = int(M_GROUND).toVar();
  const normal = vec3(0, 1, 0).toVar();
  const distance = tStart.toVar();
  const stepSize = float(0).toVar();
  const stepScale = float(1 / quality).toVar();
  const bottomed = float(0).toVar();

  Loop({ end: samples, start: 0, type: 'int' }, ({ i }) => {
    const pos = ro.add(rd.mul(distance)).toVar();
    const altitude = pos.y.sub(heightAt(pos.xz)).toVar();

    proximity.assign(proximity.min(altitude.div(distance)).max(0));

    const under = altitude.lessThan(0).toVar();

    If(under.and(i.lessThan(1)), () => {
      // The very first sample landing under the field means the ray entered
      // through the side of the box, not over the terrain: either the strata
      // wall, or the flat plinth underneath it, which is not drawn at all.
      If(pos.y.lessThan(0.35), () => {
        proximity.assign(9999);
        bottomed.assign(1);
      }).Else(() => {
        normal.assign(box.normal);
        material.assign(int(M_STRATA));
      });
      Break();
    });

    If(under, () => {
      stepScale.mulAssign(0.5);
      distance.subAssign(stepSize.mul(stepScale));
    }).Else(() => {
      const reach = altitude.abs().toVar();
      stepSize.assign(reach.add(reach.mul(0.01).min(1e-2)));
      distance.addAssign(stepSize.mul(stepScale));
    });
  });

  If(waterEnabled.greaterThan(0.5), () => {
    const water = boxIntersection(
      ro,
      rd,
      vec3(boxSize.x, waterHeight, boxSize.z)
    );

    If(
      water.range.y
        .greaterThan(0)
        .and(water.range.x.lessThan(distance).or(distance.lessThan(0)))
        .and(material.notEqual(int(M_STRATA))),
      () => {
        distance.assign(water.range.x.max(0));
        normal.assign(water.normal);
        material.assign(int(M_WATER));
      }
    );
  });

  If(box.range.y.lessThan(0), () => {
    proximity.assign(9999);
    bottomed.assign(1);
  });

  const hit = select(
    bottomed.greaterThan(0.5).or(distance.greaterThan(tEnd)),
    float(MISS),
    distance
  );

  return {
    boxEntry: box.range.x,
    boxExit: box.range.y,
    hit,
    material,
    normal,
    proximity,
  };
}
