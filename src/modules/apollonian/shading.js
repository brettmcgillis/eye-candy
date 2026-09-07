import { Loop, float, vec3 } from 'three/tsl';

import { AO_SAMPLES, AO_STEP, NORMAL_EPSILON } from './constants';

export function sdfNormal(df, p, epsilon = NORMAL_EPSILON) {
  const e = float(epsilon);
  const dx = vec3(e, 0, 0);
  const dy = vec3(0, e, 0);
  const dz = vec3(0, 0, e);

  return vec3(
    df(p.add(dx)).sub(df(p.sub(dx))),
    df(p.add(dy)).sub(df(p.sub(dy))),
    df(p.add(dz)).sub(df(p.sub(dz)))
  ).normalize();
}

// Accumulates how much nearer the surface is than an unoccluded march would
// be, sample by sample along the normal.
export function sdfAO(df, p, n, options = {}) {
  const { samples = AO_SAMPLES, stepSize = AO_STEP, strength = 1 } = options;

  const t = float(stepSize).toVar();
  const occlusion = float(0).toVar();

  Loop({ end: samples, start: 0, type: 'int' }, () => {
    occlusion.addAssign(t.sub(df(p.add(n.mul(t)))));
    t.addAssign(stepSize);
  });

  return occlusion.mul(strength).clamp(0, 1);
}
