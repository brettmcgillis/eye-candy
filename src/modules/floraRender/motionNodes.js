/* eslint-disable camelcase */
import {
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
  cos,
  max,
  min,
  mix,
  modelWorldMatrix,
  mx_noise_vec3,
  normalize,
  pow,
  screenSize,
  sin,
  smoothstep,
  time,
  vec3,
  vec4,
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

const CROWN_SHARE = 0.72;
const SEED_FLIGHT = 0.35;

// Unravel runs in branch-distance order rather than raw birth time: birth is
// bunched near 1 by the growth burst, so reversing it directly wiped the whole
// crown in a sliver of the exit and left a long bare-stem tail.
export function unravelGrowth(u) {
  const crown = clamp(u.exit.div(CROWN_SHARE), 0, 1).oneMinus();
  const stem = clamp(
    u.exit.sub(CROWN_SHARE).div(1 - CROWN_SHARE),
    0,
    1
  ).oneMinus();
  const crownGrowth = u.stemPhase.add(
    u.stemPhase.oneMinus().mul(pow(crown, u.burst))
  );
  const paced = u.exit
    .lessThan(CROWN_SHARE)
    .select(crownGrowth, u.stemPhase.mul(stem));

  return min(u.growth, paced);
}

function releaseAt(birth, u) {
  const crownDistance = pow(
    clamp(birth.sub(u.stemPhase).div(max(u.stemPhase.oneMinus(), 1e-3)), 0, 1),
    u.burst.reciprocal()
  );
  const onStem = clamp(birth.div(max(u.stemPhase, 1e-3)), 0, 1);

  return birth.greaterThanEqual(u.stemPhase).select(
    crownDistance.oneMinus().mul(CROWN_SHARE),
    onStem
      .oneMinus()
      .mul(1 - CROWN_SHARE)
      .add(CROWN_SHARE)
  );
}

export function seedFlight(p, birth, rand, u) {
  const release = releaseAt(birth, u);
  const span = clamp(release.oneMinus(), 0.08, SEED_FLIGHT);
  const released = clamp(u.exit.sub(release).div(span), 0, 1);
  const ease = released.mul(released.mul(-1).add(2));
  const out = normalize(p.sub(u.center).add(vec3(0, 1e-3, 0)));
  const heading = normalize(
    mix(out, u.scatterDir, u.scatterDrift).add(vec3(0, u.scatterLift, 0))
  );
  const curl = mx_noise_vec3(
    p.mul(0.25).add(vec3(rand.mul(11), released.mul(1.5), rand.mul(7)))
  ).mul(u.scatterTurbulence);
  const flutter = u.scatterDir
    .mul(sin(released.mul(7).add(rand.mul(6.3))))
    .mul(u.scatterFlutter)
    .mul(released);
  const fall = released.mul(released).mul(u.scatterGravity);
  const offset = heading
    .add(curl.mul(0.5))
    .mul(u.scatterDistance)
    .mul(ease)
    .add(flutter)
    .sub(vec3(0, fall, 0));
  const spin = normalize(
    vec3(
      rand.sub(0.5),
      rand.mul(7.1).fract().sub(0.5),
      rand.mul(3.3).fract().sub(0.5)
    )
  )
    .mul(u.scatterSpin)
    .mul(ease);

  return {
    fade: smoothstep(0.7, 1, released).oneMinus(),
    offset,
    spin,
  };
}

export function worldPerPixel(p) {
  const world = modelWorldMatrix.mul(vec4(p, 1)).xyz;
  const distance = world.sub(cameraPosition).length();

  return distance.mul(2).div(cameraProjectionMatrix[1][1].mul(screenSize.y));
}
