import {
  Break,
  If,
  Loop,
  atan,
  float,
  int,
  interleavedGradientNoise,
  screenCoordinate,
  smoothstep,
  texture3D,
  uniform,
  uniformArray,
  vec3,
} from 'three/tsl';

import createSteamNoise, { NOISE_TILE } from './steamNoise';
import { TRAIL_POINTS, createTrailArrays } from './steamTrail';

export function createSteamUniforms() {
  const arrays = createTrailArrays();

  return {
    arrays,
    cameraClear: uniform(0.8),
    coronaDensity: uniform(1),
    coronaThickness: uniform(0.24),
    haloStrength: uniform(0.01),
    noise: createSteamNoise(),
    noiseScale: uniform(2),
    riseSpeed: uniform(0.4),
    boil: uniform(0.6),
    steamAbsorb: uniform(0.25),
    steamEnabled: uniform(1),
    steamScatter: uniform(0.1),
    steamSteps: uniform(12, 'int'),
    steamTime: uniform(0),
    sphereRadius: uniform(0.6),
    trailDensity: uniform(1),
    trailShapes: uniformArray(arrays.shapes, 'vec4'),
    trailWeights: uniformArray(arrays.weights, 'vec4'),
    wisp: uniform(0.5),
  };
}

const CORONA_REACH = 4;

// A capsule's bounding sphere: midpoint, half its length plus its fatter end.
function capsuleBound(s, i) {
  const a = s.trailShapes.element(i);
  const b = s.trailShapes.element(i.add(1));
  const live = s.trailWeights
    .element(i)
    .x.max(s.trailWeights.element(i.add(1)).x);
  const center = a.xyz.add(b.xyz).mul(0.5);
  const radius = b.xyz.sub(a.xyz).length().mul(0.5).add(a.w.max(b.w));
  return { center, live, radius };
}

function raySphere(ro, rd, center, radius) {
  const oc = ro.sub(center);
  const b = oc.dot(rd);
  const disc = b.mul(b).sub(oc.dot(oc)).add(radius.mul(radius));
  const root = disc.max(0).sqrt();
  return {
    far: b.negate().add(root),
    hit: disc.greaterThan(0),
    near: b.negate().sub(root),
  };
}

// Three sources share one density field: a shell boiling off the sphere, a
// capsule chain through the puffs it has shed (the wake, and the plume once
// they have risen), and noise eroding both into wisps. Max, not sum, along
// the chain, so overlapping capsules don't double up at every joint. Only
// the capsules this ray actually crosses are in `mask`.
function steamDensity(s, light, ro, p, mask, corona) {
  const density = float(0).toVar();

  If(corona, () => {
    density.assign(
      p
        .sub(light)
        .length()
        .sub(s.sphereRadius)
        .max(0)
        .div(s.coronaThickness)
        .negate()
        .exp()
        .mul(s.coronaDensity)
    );
  });

  const trail = float(0).toVar();
  Loop({ end: TRAIL_POINTS - 1, start: 0, type: 'int' }, ({ i }) => {
    If(mask.shiftRight(i).bitAnd(1).equal(1), () => {
      const a = s.trailShapes.element(i);
      const b = s.trailShapes.element(i.add(1));
      const ab = b.xyz.sub(a.xyz);
      const h = p.sub(a.xyz).dot(ab).div(ab.dot(ab).add(1e-8)).clamp(0, 1);
      const radius = a.w.mix(b.w, h);
      const weight = s.trailWeights
        .element(i)
        .x.mix(s.trailWeights.element(i.add(1)).x, h);
      const q = p
        .sub(a.xyz.add(ab.mul(h)))
        .length()
        .div(radius);
      const falloff = q.mul(q).oneMinus().max(0);
      trail.assign(trail.max(falloff.mul(falloff).mul(weight)));
    });
  });

  density.addAssign(trail.mul(s.trailDensity));

  // Noise only where there is steam to erode — it is the costliest term.
  If(density.greaterThan(1e-3).and(s.wisp.greaterThan(0)), () => {
    const q = p
      .sub(vec3(0, s.riseSpeed.mul(s.steamTime), 0))
      .mul(s.noiseScale)
      .add(vec3(0, 0, s.boil.mul(s.steamTime)));
    const n = texture3D(s.noise, q.mul(NOISE_TILE)).level(0).r;
    density.assign(density.sub(s.wisp.mul(n.oneMinus())).max(0));
  });

  return density.mul(
    smoothstep(s.cameraClear.mul(0.5), s.cameraClear, p.sub(ro).length())
  );
}

// Each ray first finds which capsules it crosses and the span covering them,
// so the step loop only marches that span and only evaluates those capsules.
// The wake trails back toward the chase camera, so a single bound around the
// whole trail usually contains the camera and culls nothing.
//
// In-scatter is the same glow that lights the rock, so the vapour is hot
// beside the sphere and cools exactly as the walls do.
export function marchSteam(s, glow, light, ro, rd, tEnd) {
  const scattered = vec3(0).toVar();
  const transmittance = float(1).toVar();

  If(s.steamEnabled.greaterThan(0.5), () => {
    const mask = int(0).toVar();
    const t0 = float(1e9).toVar();
    const t1 = float(0).toVar();

    const shell = raySphere(
      ro,
      rd,
      light,
      s.sphereRadius.add(s.coronaThickness.mul(CORONA_REACH))
    );
    const corona = shell.hit.and(s.coronaDensity.greaterThan(0)).toVar();
    If(corona, () => {
      t0.assign(shell.near);
      t1.assign(shell.far);
    });

    Loop({ end: TRAIL_POINTS - 1, start: 0, type: 'int' }, ({ i }) => {
      const bound = capsuleBound(s, i);
      const span = raySphere(ro, rd, bound.center, bound.radius);
      If(span.hit.and(bound.live.greaterThan(0)), () => {
        mask.assign(mask.bitOr(int(1).shiftLeft(i)));
        t0.assign(t0.min(span.near));
        t1.assign(t1.max(span.far));
      });
    });

    t0.assign(t0.max(s.cameraClear.mul(0.5)));
    t1.assign(t1.min(tEnd));

    If(t1.greaterThan(t0), () => {
      const dt = t1.sub(t0).div(s.steamSteps.toFloat());
      const t = t0
        .add(dt.mul(interleavedGradientNoise(screenCoordinate.xy)))
        .toVar();

      Loop({ end: s.steamSteps, start: 0, type: 'int' }, () => {
        const p = ro.add(rd.mul(t));
        const density = steamDensity(s, light, ro, p, mask, corona);

        If(density.greaterThan(0), () => {
          scattered.addAssign(
            glow(p.sub(light).length())
              .mul(density.mul(s.steamScatter).mul(dt))
              .mul(transmittance)
          );
          transmittance.mulAssign(
            density.mul(s.steamAbsorb).mul(dt).negate().exp()
          );
        });

        If(transmittance.lessThan(0.01), () => {
          Break();
        });
        t.addAssign(dt);
      });
    });
  });

  return { scattered, transmittance };
}

// Thin air lit by the same exponential glow as the rock, integrated along
// the eye ray. The integral of exp(-k·√(h² + x²)) over the whole line is
// 2h·K₁(kh); exp(-kh)·√(2πh/k + 4/k²) matches it at both ends (h → 0 and
// h → ∞) without a Bessel function. The atan term is the share of that line
// that lies between the camera and the hit, which is what hides the halo
// behind a wall. Its width is the glow's, so Range sizes both together.
export function airlight(s, palette, glowRate, light, ro, rd, tEnd) {
  const toLight = light.sub(ro);
  const along = toLight.dot(rd);
  const miss = toLight.dot(toLight).sub(along.mul(along)).max(0).sqrt();
  const k = glowRate;

  const line = k
    .mul(miss)
    .negate()
    .exp()
    .mul(
      miss
        .mul(Math.PI * 2)
        .div(k)
        .add(float(4).div(k.mul(k)))
        .sqrt()
    );

  const spread = miss.max(float(1).div(k));
  const share = atan(tEnd.sub(along).div(spread))
    .add(atan(along.div(spread)))
    .div(Math.PI);

  return palette(miss).mul(line.mul(share).mul(s.haloStrength));
}
