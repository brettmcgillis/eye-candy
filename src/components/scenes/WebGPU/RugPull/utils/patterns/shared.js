import { abs, dot, fract, vec2, vec3 } from 'three/tsl';

export const CHANNELS = ['x', 'y', 'z'];

export function triangleWave(a, scale, offset) {
  return abs(fract(a.add(offset).mul(scale)).sub(0.5));
}

const FIXED_OFFSET = vec2(1, 0.5);

export function fixedTriangleWave(a) {
  return triangleWave(a, 1.5, FIXED_OFFSET);
}

export function hash31(p) {
  const a = fract(vec3(p).mul(vec3(0.1031, 0.103, 0.0973))).toVar();
  a.addAssign(dot(a, a.yzx.add(33.33)));
  return fract(a.xxy.add(a.yzz).mul(a.zyx));
}

export function hash13(p) {
  const a = fract(p.mul(0.1031)).toVar();
  a.addAssign(dot(a, a.zyx.add(31.32)));
  return fract(a.x.add(a.y).mul(a.z));
}

export function pan(time, divisor) {
  return vec2(time.div(2), time.div(3)).div(divisor);
}
