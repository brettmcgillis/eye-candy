import { Break, If, Loop, float } from 'three/tsl';

import { HIT_EPSILON, MARCH_STEPS, MAX_TRACE, MIN_STEP } from './constants';

// MarchShadow: sphere-trace `sceneFn` from a light origin along `dir` and
// return the distance to the first occluder. Deliberately marches from
// `origin + dir*t` (the correct radial form), NOT the reference's
// `Scene(dir*t - origin)` — that centred-space quirk only works for lights
// near the origin and breaks for the arbitrary world-space light positions we
// have here.
export default function marchShadow(sceneFn, origin, dir) {
  const t = float(0).toVar();

  Loop({ end: MARCH_STEPS, start: 0, type: 'int' }, () => {
    const ds = sceneFn(origin.add(dir.mul(t)));
    If(ds.lessThan(HIT_EPSILON), () => {
      Break();
    });
    t.addAssign(ds.max(MIN_STEP));
    If(t.greaterThan(MAX_TRACE), () => {
      Break();
    });
  });

  return t;
}
