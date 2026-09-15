/* eslint-disable camelcase */
import {
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
  cos,
  max,
  mix,
  mx_noise_vec3,
  normalize,
  rotate,
  screenSize,
  sin,
  smoothstep,
  time,
  vec3,
} from 'three/tsl';

export function growFraction(t0, t1, growth) {
  return clamp(growth.sub(t0).div(max(t1.sub(t0), 1e-4)), 0, 1);
}

export function windOffset(p, flex, u) {
  const phase = p.x.mul(0.35).add(p.z.mul(0.35)).add(p.y.mul(0.22));
  const t = time.mul(u.windSpeed);
  const sway = vec3(
    sin(t.add(phase)).add(sin(t.mul(2.3).add(phase.mul(1.7))).mul(0.35)),
    sin(t.mul(1.7).add(phase.mul(0.9))).mul(0.15),
    cos(t.mul(0.8).add(phase.mul(1.3))).mul(0.6)
  );

  return sway.mul(u.windStrength).mul(flex.mul(flex));
}

export function scatterState(p, crownT, stemness, rand, u) {
  const order = mix(
    crownT.oneMinus().mul(0.5).add(rand.mul(0.3)),
    rand.mul(0.12).add(0.72),
    stemness
  );
  const age = clamp(u.exit.sub(order).div(max(order.oneMinus(), 0.12)), 0, 1);
  const out = normalize(p.sub(u.center).add(vec3(0, 1e-3, 0)));
  const drift = mix(
    out.mul(u.scatterSpread).add(vec3(0, u.scatterLift, 0)),
    vec3(out.x.mul(0.25), -0.7, out.z.mul(0.25)),
    stemness
  );
  const turbulence = mx_noise_vec3(p.mul(0.3).add(vec3(rand.mul(9), 0, 0))).mul(
    u.scatterTurbulence
  );
  const offset = drift.add(turbulence).mul(u.scatterDistance).mul(age.mul(age));
  const spin = vec3(
    rand.sub(0.5),
    rand.mul(7.1).fract().sub(0.5),
    rand.mul(3.3).fract().sub(0.5)
  )
    .mul(u.scatterSpin)
    .mul(age);

  return {
    fade: smoothstep(0.35, 1, age).oneMinus(),
    offset,
    spin,
  };
}

export function spinAbout(point, pivot, euler) {
  return rotate(point.sub(pivot), euler).add(pivot);
}

export function worldPerPixel(p) {
  const distance = p.sub(cameraPosition).length();

  return distance.mul(2).div(cameraProjectionMatrix[1][1].mul(screenSize.y));
}
