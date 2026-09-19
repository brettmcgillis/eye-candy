import { abs, vec2, vec3 } from 'three/tsl';

import { pan, triangleWave } from './shared';

const OFFSET = vec2(1, 0.5);
const SCALE = 1.5;
const SQRT3 = Math.sqrt(3);

const tri = (a) => triangleWave(a, SCALE, OFFSET);

export function fractalKnots7({ fragCoord, resolution, time }) {
  const t1 = 36 * 8;
  const uv = fragCoord
    .div(resolution.y)
    .div(t1 * 2)
    .add(pan(time, t1 * 8))
    .toVar();
  const col = vec3(0).toVar();

  for (let i = 0; i < 15; i += 1) {
    const t2 = vec2(0).toVar();
    for (let k = 0; k < 3; k += 1) {
      uv.addAssign(t2.yx);
      uv.divAssign(-SCALE);
      const previous = vec2(t2).toVar();
      t2.assign(tri(uv.yx.sub(0.5)));
      const t3 = tri(uv);
      uv.assign(t2.add(t3).div(SCALE).yx);
      t2.divAssign(previous.yx.add(1.5));
    }
    col.x.assign(abs(uv.y.sub(uv.x).add(col.x)));
    col.assign(col.yzx);
  }

  return col;
}

export function frostFractal({ fragCoord, resolution, time }) {
  const t1 = 16 * 16 * 8;
  const uv = fragCoord
    .div(resolution.y)
    .div(t1 * 2)
    .add(pan(time, t1 * 8))
    .toVar();
  const col = vec3(0).toVar();

  for (let i = 0; i < 6; i += 1) {
    const t2 = vec2(0).toVar();
    for (let k = 0; k < 3; k += 1) {
      uv.addAssign(t2.yx.add(1));
      t2.assign(tri(uv.yx.sub(0.5)));
      const t3 = tri(uv);
      uv.assign(t2.sub(t3).div(SCALE).yx);
    }
    col.x.assign(uv.y.add(uv.x).add(col.x).div(SQRT3));
    col.assign(abs(col.add(vec3(col.x))).div(SQRT3));
  }

  return col.mul(3);
}
