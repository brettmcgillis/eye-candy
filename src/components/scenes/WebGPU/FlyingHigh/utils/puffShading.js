import {
  float,
  max,
  mix,
  screenCoordinate,
  select,
  smoothstep,
  sqrt,
  texture,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { PUFF_NOISE_SIZE } from '../hooks/usePuffNoise';

// Painted light, fixed to the page: top left, a little toward the viewer.
const PAGE_LIGHT = vec3(-0.5, 0.8, 0.35).normalize();

// Three-stop fire ramp over `t` in [0, 1], cool red to hot yellow-white.
const fireRamp = (t, { cool, hot, mid }) =>
  mix(mix(cool, mid, smoothstep(0, 0.5, t)), hot, smoothstep(0.5, 1, t));

// A billboard puff shaded like a watercolour blob: a lumpy, eroding outline,
// a flat light-and-shadow wash broken up by mottling, pigment pooled dark at
// the rim, and paper granulation. Opaque and alpha-tested, so puffs layer by
// depth with no sort. `heat` > 0 paints fire instead of smoke, `glow` warms
// smoke near the fire, `fade` thins it toward `u.faded` as it ages, and
// `mass` (0 base to 1 top) lights a cluster as one body, not puff by puff.
export default function createPuffMaterial({
  erode = float(0),
  fade = null,
  fire = null,
  glow = float(0),
  heat = float(0),
  mass = null,
  noise,
  seed,
  u,
}) {
  const material = new THREE.SpriteNodeMaterial({
    alphaTest: 0.5,
    depthWrite: true,
    toneMapped: false,
    transparent: false,
  });

  const q = uv().mul(2).sub(1);
  const r = q.length();
  const n = texture(
    noise,
    q.mul(0.21).add(vec2(seed.mul(7.13), seed.mul(3.71)))
  );
  const radius = float(1)
    .sub(u.edgeJag.mul(n.r))
    .mul(float(1).sub(erode.pow(1.5).mul(0.85)));
  const inside = r
    .lessThan(radius)
    .and(n.g.greaterThan(erode.mul(1.3).sub(0.3)));

  const s = r.div(radius).clamp(0, 1);
  const normal = vec3(q.div(radius), sqrt(max(float(1).sub(s.mul(s)), 0)));
  const mottle = n.b.mul(2).sub(1);
  let light = smoothstep(
    -0.15,
    0.45,
    normal.normalize().dot(PAGE_LIGHT).add(mottle.mul(u.mottle))
  );
  if (mass)
    light = mix(light, mass.add(mottle.mul(u.mottle)).clamp(0, 1), 0.65);
  const rim = smoothstep(0.7, 1, s)
    .mul(u.rim)
    .mul(smoothstep(0.35, 0.65, n.b).mul(1.2).add(0.4));
  const grain = texture(noise, screenCoordinate.div(PUFF_NOISE_SIZE))
    .a.mul(2)
    .sub(1)
    .mul(u.grain)
    .add(1);
  const tint = n.r.sub(0.5).mul(0.12).add(1);

  let smoke = mix(u.shadow, u.lit, light).add(
    u.glowColor.mul(glow).mul(float(1).sub(light).mul(0.7).add(0.3))
  );
  if (fade) smoke = mix(smoke, u.faded, fade);
  smoke = smoke.mul(float(1).sub(rim)).mul(tint);

  let colour = smoke;
  if (fire) {
    const flame = fireRamp(
      heat.add(mottle.mul(0.22)).add(light.sub(0.5).mul(0.25)).clamp(0, 1),
      fire
    )
      .mul(float(1).sub(rim.mul(0.45)))
      .mul(fire.intensity);
    colour = mix(smoke, flame, smoothstep(0.02, 0.12, heat));
  }

  material.colorNode = colour.div(grain);
  material.opacityNode = select(inside, float(1), float(0));
  return material;
}
