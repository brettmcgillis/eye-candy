import {
  abs,
  cos,
  float,
  fract,
  length,
  max,
  select,
  sin,
  vec2,
  vec3,
} from 'three/tsl';

import { pan, fixedTriangleWave as tri } from './shared';

export function blackAndWhiteRug({ fragCoord, resolution, time }) {
  const t1 = 8;
  const uv = fragCoord
    .div(resolution.y)
    .div(t1 * 2)
    .toVar();
  uv.x.addAssign(time.div(t1 * 12));
  const t2 = vec2(0).toVar();
  const shade = float(0).toVar();

  for (let k = 0; k < 12; k += 1) {
    uv.assign(abs(uv.add(t2).add(0.5)));
    t2.assign(tri(uv.add(0.5)).div(1.5));
    uv.assign(t2.sub(tri(uv.yx)).div(1.5));
    shade.assign(max(length(uv.add(t2)).div(2), shade));
    shade.assign(max(abs(shade.sub(shade.oneMinus())), shade.div(4)));
  }

  return vec3(shade);
}

export function redAndBlueRug({ fragCoord, resolution, time }) {
  const t1 = 8;
  const uv = fragCoord
    .div(resolution.y)
    .div(t1 * 2)
    .add(pan(time, t1 * 8))
    .toVar();
  const t2 = vec2(0).toVar();
  const col = vec3(0).toVar();

  for (let k = 0; k < 9; k += 1) {
    uv.assign(uv.add(t2).div(1.5));
    t2.assign(tri(uv.sub(0.5)).negate());
    uv.assign(t2.sub(tri(uv.yx)));
    col.assign(abs(vec3(uv.y.sub(uv.x), col.yz)));
    col.assign(select(uv.x.lessThan(uv.y), col.yzx, col));
  }

  return col.mul(2);
}

export function redAndBlackRug({ fragCoord, resolution, time }) {
  const t1 = 6;
  const uv = fragCoord
    .div(resolution.y)
    .div(t1 * 2)
    .add(time.div(t1 * 12))
    .toVar();
  const t2 = vec2(0).toVar();
  const c1 = float(0).toVar();
  const red = float(0).toVar();

  for (let k = 0; k < 12; k += 1) {
    uv.assign(uv.add(t2).div(1.5));
    uv.assign(uv.add(vec2(0.5, 1.5)).mul(1.5).sub(0.5).div(1.5));
    t2.assign(tri(uv.add(0.5)));
    uv.assign(t2.div(2).sub(tri(uv.yx)));
    t2.x.subAssign(1);
    uv.y.addAssign(select(uv.x.greaterThan(uv.y), float(0.25), float(0)));

    c1.assign(max(abs(t2.y.sub(t2.x)).div(2), c1));
    c1.assign(max(abs(c1.mul(2).sub(1)).oneMinus(), 0));
    red.assign(abs(c1.sub(red)).div(2));
  }

  return vec3(red.mul(2), 0, 0);
}

function flowerTransform(uv, t2) {
  t2.assign(tri(uv.add(0.5)));
  uv.assign(t2.sub(tri(uv.yx)).sub(fract(t2.div(2))));
}

export function greenAndGoldFlowerRug({ fragCoord, resolution, time }) {
  const t1 = 2 * 8;
  const warpScale = 16;
  const uv = fragCoord
    .div(resolution.y)
    .div(t1 * 2)
    .add(time.div(t1 * 12 * 2))
    .toVar();
  const t2 = vec2(0).toVar();
  const col = vec3(0).toVar();
  const col1 = vec3(0).toVar();
  const c1 = float(0).toVar();

  for (let k = 0; k < 15; k += 1) {
    const warpRaw = vec2(
      sin(t2.x.mul(warpScale)),
      cos(t2.y.mul(warpScale))
    ).toVar();
    uv.y.subAssign(0.25);
    uv.assign(uv.add(t2).div(1.5));
    uv.assign(
      fract(uv.add(vec2(0.5, 1.5)).mul(1.5))
        .sub(0.5)
        .div(1.5)
    );
    col.x.assign(max(length(uv.sub(t2).sub(c1)).div(3), col.x));

    const warp =
      k > 1 ? warpRaw.mul(warpRaw).div(warpScale).toVar() : vec2(0).toVar();
    const uv1 = uv.add(warp.yx).toVar();
    const t21 = t2.add(warp.yx).toVar();
    flowerTransform(uv, t2);
    flowerTransform(uv1, t21);

    c1.assign(max(abs(uv1.y.add(uv1.x)).div(2), c1));
    c1.assign(max(abs(c1.mul(2).sub(1)).oneMinus(), c1.div(4)));
    col.x.assign(max(length(uv1.sub(t21).sub(c1)).div(3), col.x));
    col.assign(abs(col.sub(c1.mul(col.x).oneMinus())));
    col1.assign(abs(col1.mul(c1).sub(col).sub(1)).yzx);
  }

  return col1.div(2);
}
