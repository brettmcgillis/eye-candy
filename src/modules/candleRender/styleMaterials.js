import {
  attribute,
  color,
  float,
  floor,
  max,
  mix,
  mx_noise_float as mxNoise,
  mx_noise_vec3 as mxNoiseVec3,
  normalView,
  normalWorld,
  positionLocal,
  positionWorld,
  saturation,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const KEY = new THREE.Vector3(0.45, 0.8, 0.55).normalize();
const GLOW = new THREE.Color('#ff8a3a');

// Diffuse light quantised into `bands` flat tones.
export function toonTone(lit, bands) {
  return floor(lit.mul(bands).add(0.5)).div(bands).clamp(0, 1);
}

// Light reaching a world point from both flames (`u.flameTop`,
// `u.flameBottom`, `u.light`), falling off over a couple of radii.
export function flameReach(u, reach) {
  const near = (at) =>
    float(1).div(positionWorld.sub(at).length().div(reach).pow(2).add(1));
  return near(u.flameTop).add(near(u.flameBottom)).mul(u.light);
}

// Cartoon wax: unlit, a key from above and the flames' light quantised
// into flat bands, colour pushed saturated, the crater's glow as its own
// band so a lit rim still reads hot.
export function createToonWaxMaterial(u) {
  const material = new THREE.MeshBasicNodeMaterial();
  const key = max(normalWorld.dot(vec3(KEY.x, KEY.y, KEY.z)), 0);
  const lit = key
    .mul(0.55)
    .add(0.25)
    .add(flameReach(u, u.radius.mul(2.2)).mul(0.5));
  const tone = toonTone(lit, u.bands);
  const glow = toonTone(attribute('glow', 'float').mul(u.light), u.bands);
  material.colorNode = saturation(u.wax, float(1.1))
    .mul(mix(float(0.3), float(1.12), tone))
    .add(color(GLOW).mul(glow).mul(0.55));
  return material;
}

// The ink line round a toon mesh: its back faces pushed out along the
// normals by `u.outline`.
export function createOutlineMaterial(u) {
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
  material.colorNode = u.ink;
  material.positionNode = positionLocal.add(
    attribute('normal', 'vec3').mul(u.outline)
  );
  return material;
}

// Plasticine's surface: thumb-pressed dents and fine ridges bent into the
// shading normal, `u.prints` strong, at `scale` (larger is finer).
export function clayNormal(u, scale = 1) {
  const p = positionLocal.mul(scale);
  const dents = mxNoiseVec3(p.mul(14)).mul(0.3);
  const ridges = mxNoiseVec3(p.mul(vec3(70, 24, 70))).mul(0.07);
  return normalView.add(dents.add(ridges).mul(u.prints)).normalize();
}

// Cartoon-bright, matte clay: soft roughness, a faint sheen and colour that
// wobbles a little where it was kneaded.
export function createClayMaterial(
  u,
  colorNode,
  { scale = 1, glow = null } = {}
) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.62,
  });
  const knead = mxNoise(positionLocal.mul(scale * 7))
    .mul(0.06)
    .add(1);
  material.colorNode = colorNode.mul(knead);
  material.normalNode = clayNormal(u, scale);
  if (glow) material.emissiveNode = glow;
  return material;
}
