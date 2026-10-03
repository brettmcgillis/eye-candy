/* eslint-disable camelcase, no-param-reassign */
import {
  abs,
  cameraPosition,
  clamp,
  dot,
  exp,
  float,
  fog,
  max,
  mix,
  mx_noise_float,
  positionLocal,
  positionWorld,
  pow,
  select,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const DEG = Math.PI / 180;
const SKY_RADIUS = 9000;

export function createAtmosphereUniforms() {
  return {
    density: uniform(0.009),
    drift: uniform(1.5),
    fogColor: uniform(new THREE.Color('#a9aeab')),
    glow: uniform(0.2),
    glowColor: uniform(new THREE.Color('#d9d6cc')),
    haze: uniform(500),
    height: uniform(45),
    horizon: uniform(new THREE.Color('#b7bbb8')),
    noise: uniform(0.5),
    phase: uniform(0),
    sun: uniform(new THREE.Vector3(0, 1, 0)),
    zenith: uniform(new THREE.Color('#7d858b')),
  };
}

export function applyAtmosphere(uniforms, config) {
  uniforms.density.value = config.fogDensity;
  uniforms.drift.value = config.fogDrift;
  uniforms.fogColor.value.set(config.fogColor);
  uniforms.glow.value = config.sunGlow;
  uniforms.glowColor.value.set(config.sunGlowColor);
  uniforms.haze.value = config.hazeDistance;
  uniforms.height.value = config.fogHeight;
  uniforms.horizon.value.set(config.skyHorizon);
  uniforms.noise.value = config.fogNoise;
  uniforms.zenith.value.set(config.skyZenith);
  const a = config.lightSunAzimuth * DEG;
  const e = config.lightSunElevation * DEG;
  uniforms.sun.value.set(
    Math.sin(a) * Math.cos(e),
    Math.sin(e),
    Math.cos(a) * Math.cos(e)
  );
}

// The fog's colour along a view direction: lit toward the sun.
const inScatter = (u, direction) =>
  mix(
    u.fogColor,
    u.glowColor,
    pow(max(dot(direction, u.sun), 0), 6)
      .mul(u.glow)
      .clamp(0, 1)
  );

// Exponential height fog integrated along the view ray, in banks that drift
// on `phase` (owned by the caller, so a headless frame is deterministic),
// under a long-range haze that closes the distance. The top of a tall
// structure stands in thinner air than its foot; that falloff is most of
// the sense of height.
export function createFogNode(u) {
  const ray = positionWorld.sub(cameraPosition);
  const distance = ray.length();
  const direction = ray.div(max(distance, 1e-3));
  const b = float(1).div(u.height);
  const climb = ray.y.mul(b);
  const integral = select(
    abs(climb).lessThan(1e-3),
    float(1),
    exp(climb.negate()).oneMinus().div(climb)
  );
  const drift = u.phase.mul(u.drift);
  const bank = mx_noise_float(
    vec3(
      positionWorld.x.mul(0.006).sub(drift.mul(0.006)),
      positionWorld.y.mul(0.02),
      positionWorld.z.mul(0.006).add(drift.mul(0.0035))
    )
  )
    .mul(0.5)
    .add(0.5);
  const patchy = mix(float(1), bank.mul(1.7).add(0.15), u.noise);
  const amount = u.density
    .mul(exp(cameraPosition.y.mul(b).negate()))
    .mul(distance)
    .mul(integral)
    .mul(patchy);
  const heightFog = exp(amount.negate()).oneMinus();
  const haze = smoothstep(u.haze.mul(0.15), u.haze, distance).mul(0.92);
  const factor = clamp(
    heightFog.oneMinus().mul(haze.oneMinus()).oneMinus(),
    0,
    1
  );
  return fog(inScatter(u, direction), factor);
}

// A dome that meets the fog at the horizon, so the structure's top fades
// into the sky rather than against it.
export function createSky(u) {
  const material = new THREE.MeshBasicNodeMaterial({
    depthWrite: false,
    fog: false,
    side: THREE.BackSide,
  });
  const direction = positionLocal.normalize();
  const rise = smoothstep(0, 0.45, direction.y);
  const glow = pow(max(dot(direction, u.sun), 0), 24).mul(u.glow);
  const sky = mix(mix(u.horizon, u.fogColor, 0.35), u.zenith, rise).add(
    u.glowColor.mul(glow)
  );
  const horizonBand = smoothstep(0.12, -0.02, direction.y);
  material.colorNode = mix(sky, inScatter(u, direction), horizonBand);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(SKY_RADIUS, 48, 24),
    material
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}
