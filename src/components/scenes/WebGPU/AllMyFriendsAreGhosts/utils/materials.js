/* eslint-disable camelcase */
import {
  attribute,
  cameraPosition,
  clamp,
  dot,
  floor,
  mix,
  mx_fractal_noise_float,
  normalLocal,
  normalView,
  normalize,
  positionGeometry,
  positionLocal,
  positionViewDirection,
  positionWorld,
  pow,
  smoothstep,
  texture,
  transformNormalToView,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export const CLOUD_DECK_SIZE = 16000;
const CLOUD_NOISE_SCALE = 0.0045;
export const RAIN_BOX = 28;
const GRAIN_STEP = 0.04;

export function createStarDomeMaterial(map) {
  const uniforms = { brightness: uniform(1), tint: uniform(new THREE.Color()) };
  const material = new THREE.MeshBasicNodeMaterial({
    depthWrite: false,
    fog: false,
    side: THREE.BackSide,
    toneMapped: false,
  });
  material.colorNode = texture(map)
    .rgb.mul(uniforms.tint)
    .mul(uniforms.brightness);
  return { material, uniforms };
}

export function createEarthMaterials(map) {
  const uniforms = { atmosphere: uniform(new THREE.Color()) };
  const surface = new THREE.MeshStandardNodeMaterial({
    fog: false,
    metalness: 0,
    roughness: 0.85,
  });
  surface.colorNode = texture(map).rgb;

  const atmosphere = new THREE.MeshBasicNodeMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    side: THREE.BackSide,
    transparent: true,
  });
  const rim = pow(dot(normalView, positionViewDirection).abs().oneMinus(), 3);
  atmosphere.colorNode = uniforms.atmosphere.mul(rim);
  return { atmosphere, surface, uniforms };
}

export function createTinyMoonMaterial(map, bump) {
  const uniforms = { displacement: uniform(0) };
  const material = new THREE.MeshStandardNodeMaterial({
    bumpMap: bump,
    map,
    metalness: 0,
  });
  const height = texture(bump).r.sub(0.5);
  material.positionNode = positionLocal.add(
    normalLocal.mul(height.mul(uniforms.displacement))
  );
  return { material, uniforms };
}

// Thicker toward the sun means the far side of a puff is in shade.
export function createCloudDeckMaterial() {
  const u = {
    coverage: uniform(0.5),
    horizonColor: uniform(new THREE.Color()),
    litColor: uniform(new THREE.Color()),
    scroll: uniform(0),
    shadeColor: uniform(new THREE.Color()),
    softness: uniform(0.1),
    sunDir: uniform(new THREE.Vector2(0, 1)),
    sunHeight: uniform(0.3),
  };
  const p = positionWorld.xz.add(vec2(0, u.scroll)).mul(CLOUD_NOISE_SCALE);
  const drift = u.scroll.mul(CLOUD_NOISE_SCALE * 0.03);
  const n = mx_fractal_noise_float(vec3(p, drift), 4, 2.1, 0.5);
  const toward = mx_fractal_noise_float(
    vec3(p.add(u.sunDir.mul(0.08)), drift),
    4,
    2.1,
    0.5
  );
  const density = smoothstep(
    u.coverage.sub(u.softness),
    u.coverage.add(u.softness),
    n.mul(0.5).add(0.5)
  );
  const shade = clamp(n.sub(toward).mul(3).add(0.55), 0, 1).mul(
    u.sunHeight.mul(0.6).add(0.4)
  );
  const distance = positionWorld.xz.sub(cameraPosition.xz).length();
  const fade = smoothstep(
    CLOUD_DECK_SIZE * 0.08,
    CLOUD_DECK_SIZE * 0.45,
    distance
  );

  const material = new THREE.MeshBasicNodeMaterial({
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
  });
  material.colorNode = mix(
    mix(u.shadeColor, u.litColor, shade),
    u.horizonColor,
    fade
  );
  material.opacityNode = density.mul(fade.oneMinus().mul(0.85).add(0.15));
  return { material, uniforms: u };
}

export function createRainMaterial() {
  const u = {
    color: uniform(new THREE.Color()),
    flash: uniform(0),
    opacity: uniform(0.3),
    phase: uniform(0),
    velocity: uniform(new THREE.Vector3()),
  };
  const offset = attribute('dropOffset', 'vec4');
  const travelled = offset.xyz.add(u.velocity.mul(u.phase));
  // Floored, not TSL's truncating mod: the velocity is negative.
  const wrapped = travelled
    .sub(floor(travelled.div(RAIN_BOX)).mul(RAIN_BOX))
    .sub(RAIN_BOX / 2);

  const material = new THREE.MeshBasicNodeMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
  });
  material.positionNode = positionGeometry.add(wrapped);
  material.colorNode = vec3(u.color).mul(u.flash.mul(4).add(1));
  material.opacityNode = u.opacity.mul(offset.w.mul(0.6).add(0.4));
  return { material, uniforms: u };
}

export function createRegolithMaterial() {
  const u = {
    dark: uniform(new THREE.Color()),
    grain: uniform(0.4),
    light: uniform(new THREE.Color()),
  };
  const p = positionWorld.xz;
  const albedo = smoothstep(
    -0.6,
    0.6,
    mx_fractal_noise_float(vec3(p.mul(0.03), 0), 4).add(
      mx_fractal_noise_float(vec3(p.mul(0.6), 1.7), 2).mul(0.35)
    )
  );
  const fine = p.mul(3.1);
  const h0 = mx_fractal_noise_float(vec3(fine, 0), 3);
  const hx = mx_fractal_noise_float(vec3(fine.add(vec2(GRAIN_STEP, 0)), 0), 3);
  const hz = mx_fractal_noise_float(vec3(fine.add(vec2(0, GRAIN_STEP)), 0), 3);
  const slope = vec3(hx.sub(h0), 0, hz.sub(h0)).div(GRAIN_STEP).mul(u.grain);

  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.97,
  });
  material.colorNode = mix(u.dark, u.light, albedo);
  material.normalNode = transformNormalToView(
    normalize(normalLocal.sub(slope))
  );
  return { material, uniforms: u };
}
