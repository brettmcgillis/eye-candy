// Liquid layer materials — one shared uniform set drives both the coat shell
// (inflated copy of the skull) and the instanced drips, so a single Leva
// control updates everything at once.
//
// The material is a full MeshPhysicalNodeMaterial so the same shader covers
// the whole customization range: transmission/IOR for clean water, dark
// clearcoat for used oil, emissive + iridescence for stylized slime.
import {
  mx_noise_float as mxNoiseFloat,
  normalLocal,
  normalWorld,
  normalize,
  positionLocal,
  positionWorld,
  smoothstep,
  time,
  transformNormalToView,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createLiquidUniforms() {
  return {
    // Surface look
    liquidColor: uniform(new THREE.Color('#16100a')),
    emissiveColor: uniform(new THREE.Color('#000000')),
    emissiveIntensity: uniform(0),

    // Coat layer
    coverage: uniform(0.85), // 0 = dry bone, 1 = fully dipped
    coatSoftness: uniform(0.18), // mask edge feather
    coatThickness: uniform(0.012), // shell inflation (local units, pre-divided by skull scale)
    streakScale: uniform(3.0), // lateral noise frequency
    streakStretch: uniform(4.0), // vertical elongation of the mask noise
    topBias: uniform(0.35), // liquid accumulates from the top down
    flowSpeed: uniform(0.05), // downward crawl of the streak pattern
    rippleStrength: uniform(0.25), // normal perturbation amount
  };
}

// Streaky coverage noise — stretched along world Y and slowly flowing down,
// so the mask reads as liquid running over the surface rather than blotches.
function streakNoise(u, offset) {
  const p = positionWorld.add(offset);
  return mxNoiseFloat(
    vec3(
      p.x.mul(u.streakScale),
      p.y.mul(u.streakScale).div(u.streakStretch).sub(time.mul(u.flowSpeed)),
      p.z.mul(u.streakScale)
    )
  );
}

function buildCoverageMask(u) {
  const n = streakNoise(u, vec3(0)).mul(0.5).add(0.5);
  // Gravity bias: higher points covered first, streaks descend from the crown.
  const v = n.add(positionWorld.y.mul(u.topBias).negate());
  return smoothstep(v.sub(u.coatSoftness), v.add(u.coatSoftness), u.coverage);
}

// Rippled liquid surface — gradient of the streak noise bends the normal.
function buildRippledNormal(u) {
  const e = 0.06;
  const gx = streakNoise(u, vec3(e, 0, 0)).sub(streakNoise(u, vec3(-e, 0, 0)));
  const gy = streakNoise(u, vec3(0, e, 0)).sub(streakNoise(u, vec3(0, -e, 0)));
  const gz = streakNoise(u, vec3(0, 0, e)).sub(streakNoise(u, vec3(0, 0, -e)));
  const grad = vec3(gx, gy, gz).mul(u.rippleStrength);
  return transformNormalToView(normalize(normalWorld.sub(grad)));
}

function applySharedNodes(mat, u) {
  /* eslint-disable no-param-reassign */
  mat.colorNode = u.liquidColor;
  mat.emissiveNode = u.emissiveColor.mul(u.emissiveIntensity);
  mat.normalNode = buildRippledNormal(u);
  /* eslint-enable no-param-reassign */
}

// Scalar PBR properties (roughness, transmission, clearcoat, iridescence…)
// are set directly on the material each frame via syncLiquidScalars below.
// Toggling features like transmission changes the generated shader, so we
// bump needsUpdate whenever the feature signature changes.
export function syncLiquidScalars(mat, config) {
  const m = mat;
  /* eslint-disable no-bitwise */
  const sig =
    (config.transmission > 0 ? 1 : 0) |
    (config.clearcoat > 0 ? 2 : 0) |
    (config.iridescence > 0 ? 4 : 0);
  /* eslint-enable no-bitwise */

  m.roughness = config.roughness;
  m.metalness = config.metalness;
  m.transmission = config.transmission;
  m.ior = config.ior;
  m.thickness = config.thickness;
  m.clearcoat = config.clearcoat;
  m.clearcoatRoughness = config.clearcoatRoughness;
  m.iridescence = config.iridescence;
  m.iridescenceIOR = 1.8;

  if (m.userData.featureSig !== sig) {
    m.userData.featureSig = sig;
    m.needsUpdate = true;
  }
}

// Coat shell: same geometry as the skull, inflated along its normals so the
// detailed mesh shows through a uniform film of liquid. Coverage mask feeds
// opacity, giving the dry→dipped slider with organic streaky breakup.
export function createCoatMaterial(u) {
  const mat = new THREE.MeshPhysicalNodeMaterial();
  applySharedNodes(mat, u);

  mat.positionNode = positionLocal.add(normalLocal.mul(u.coatThickness));
  mat.opacityNode = buildCoverageMask(u);
  mat.transparent = true;
  mat.depthWrite = true;

  return mat;
}

// Drip material: identical look, no coverage mask (drips are always liquid).
export function createDripMaterial(u) {
  const mat = new THREE.MeshPhysicalNodeMaterial();
  applySharedNodes(mat, u);
  return mat;
}
