import {
  cos,
  cross,
  float,
  floor,
  fract,
  hash,
  instanceIndex,
  int,
  mix,
  mx_noise_vec3 as mxNoiseVec3,
  select,
  sin,
  smoothstep,
  sqrt,
  vec3,
} from 'three/tsl';

import { PATH_SAMPLES } from './plumes';
import createPuffMaterial from './puffShading';

const TAU = Math.PI * 2;
const ACROSS = vec3(1, 0, 0);

// Puffs born evenly over `u.life` at the start of `path` (a uniformArray of
// PATH_SAMPLES vec4s), carried along it as they age, spreading, swelling and
// billowing, burning for the first `fireShare` of the way and smoke after.
// Every position is a function of the clock, so there is no state to step.
export default function createPlumeMaterial({ count, noise, path, salt, u }) {
  const index = instanceIndex.toFloat();
  const phase = u.time.div(u.life).add(index.div(count));
  const age = fract(phase);
  const id = index.add(floor(phase).mul(count)).add(salt.mul(7919));
  const rand = (k) => hash(id.mul(8).add(k));

  const along = age.pow(u.ease);
  const f = along.mul(PATH_SAMPLES - 1);
  const i0 = floor(f).clamp(0, PATH_SAMPLES - 2);
  const p0 = path.element(int(i0)).xyz;
  const p1 = path.element(int(i0).add(1)).xyz;
  const tangent = p1.sub(p0).normalize();
  const n1 = cross(tangent, ACROSS).normalize();
  const n2 = cross(tangent, n1);

  const theta = rand(1).mul(TAU).add(along.mul(u.swirl)).add(u.time.mul(0.3));
  const spread = mix(u.spreadStart, u.spreadEnd, along.pow(0.8));
  const base = mix(p0, p1, f.sub(i0)).add(
    n1
      .mul(cos(theta))
      .add(n2.mul(sin(theta)))
      .mul(sqrt(rand(2)).mul(spread))
  );
  const billow = mxNoiseVec3(
    base.mul(u.billowScale).sub(vec3(0, u.time.mul(0.25), 0))
  )
    .mul(u.billow)
    .mul(spread)
    .mul(smoothstep(0, 0.35, along));

  const fireEnd = u.fireShare.mul(rand(4).mul(0.6).add(0.7));
  const burning = rand(5).greaterThan(u.soot);
  const heat = select(
    burning,
    float(1).sub(along.div(fireEnd)).clamp(0, 1),
    float(0)
  );
  const glow = float(1).sub(smoothstep(fireEnd, fireEnd.add(0.3), along));

  const material = createPuffMaterial({
    erode: smoothstep(u.fadeStart, 1, age).toVarying('plumeErode'),
    fade: smoothstep(0.5, 1, along).mul(u.thinning).toVarying('plumeFade'),
    fire: u.fire,
    glow: glow.mul(u.glow).toVarying('plumeGlow'),
    heat: heat.toVarying('plumeHeat'),
    mass: smoothstep(0.1, 1, along).toVarying('plumeMass'),
    noise,
    seed: rand(6).toVarying('plumeSeed'),
    u,
  });
  material.positionNode = base.add(billow);
  material.scaleNode = mix(u.sizeStart, u.sizeEnd, along.pow(0.65))
    .mul(rand(3).mul(0.9).add(0.55))
    .mul(smoothstep(0, 0.025, age));
  return material;
}
