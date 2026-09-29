import {
  attribute,
  dot,
  float,
  fract,
  mix,
  normalize,
  mx_noise_float as perlin,
  positionGeometry,
  positionWorld,
  smoothstep,
  vec2,
} from 'three/tsl';

// Straight-grained timber: rings run along each piece's own grain direction,
// warped slowly along its length, with fine flecks across it. `slab` 1 runs
// one grain across the whole board instead, as if carved from one plank.
export default function grainShade(amount, slab = float(0)) {
  const grain = attribute('grain', 'vec3');
  const run = normalize(mix(grain.xy.add(vec2(0, 1e-4)), vec2(0, 1), slab));
  const p = mix(positionGeometry.xy, positionWorld.xy, slab).mul(100);
  const along = dot(p, run);
  const across = dot(p, vec2(run.y.negate(), run.x)).add(
    grain.z.mul(float(1).sub(slab))
  );
  const warp = perlin(vec2(along.mul(0.012), across.mul(0.08))).mul(2.2);
  const ring = fract(across.mul(0.55).add(warp));
  const late = smoothstep(0.55, 0.85, ring).mul(smoothstep(1, 0.9, ring));
  const fleck = perlin(vec2(along.mul(0.25), across.mul(4)));
  return float(1)
    .sub(late.mul(0.3).mul(amount))
    .add(fleck.mul(0.06).mul(amount));
}
