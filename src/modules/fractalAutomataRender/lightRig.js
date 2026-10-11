import * as THREE from 'three/webgpu';

import { getK } from '@modules/fractalAutomata';

const DEG_TO_RAD = Math.PI / 180;
const KEY_LIGHT_DISTANCE_SCALE = 2.69284236449147;
const SKY_COLOR = '#b9d4ff';
const GROUND_COLOR = '#030403';
const KEY_COLOR = '#fff0d3';
const RIM_COLOR = '#70a8ff';
const BOUNCE_COLOR = '#8dd06e';
const SHADOW_MAP_SIZE = 2048;
const SHADOW_BIAS = -0.00035;
const SHADOW_NORMAL_BIAS = 0.045;
// SHADOW_BIAS/SHADOW_NORMAL_BIAS were tuned against cellSpacing 0.6; normalBias
// is a fixed world-space offset, so it scales with the smallest cube drawn or
// the fine detail tier self-shadows into acne.
const SHADOW_BIAS_REFERENCE_CELL_SPACING = 0.6;

export function structureExtent(config) {
  return Math.max(
    24 * config.cellSpacing,
    getK(config.level) * config.cellSpacing
  );
}

export function keyLightPosition(config) {
  const extent = structureExtent(config);
  const azimuth = config.lightAzimuth * DEG_TO_RAD;
  const elevation = config.lightElevation * DEG_TO_RAD;
  const distance = extent * KEY_LIGHT_DISTANCE_SCALE;
  const horizontal = Math.cos(elevation) * distance;
  return [
    Math.cos(azimuth) * horizontal,
    extent * 0.12 + Math.sin(elevation) * distance,
    Math.sin(azimuth) * horizontal,
  ];
}

// Ports ~/dev/examples/260708_AutomataChunks's light rig: a hemisphere fill, a
// shadow-casting key orbiting azimuth/elevation, and fixed rim and bounce
// fills, all scaled off the structure's extent. The scene mounts `group`; the
// headless renders add it to their own scene.
export function createLightRig({ shadows = true } = {}) {
  const group = new THREE.Group();
  const hemisphere = new THREE.HemisphereLight(SKY_COLOR, GROUND_COLOR);
  const key = new THREE.DirectionalLight(KEY_COLOR);
  const rim = new THREE.DirectionalLight(RIM_COLOR);
  const bounce = new THREE.DirectionalLight(BOUNCE_COLOR);
  const targets = [key, rim, bounce].map((light) => {
    const target = new THREE.Object3D();
    // eslint-disable-next-line no-param-reassign
    light.target = target;
    return target;
  });

  key.castShadow = shadows;
  key.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  group.add(hemisphere, key, rim, bounce, ...targets);

  return {
    group,
    key,

    apply(config) {
      const extent = structureExtent(config);
      const targetY = extent * 0.12;
      const [keyTarget, rimTarget, bounceTarget] = targets;
      keyTarget.position.set(0, targetY, 0);
      rimTarget.position.set(0, targetY, 0);
      bounceTarget.position.set(0, targetY * 0.4, 0);

      hemisphere.intensity = config.ambientIntensity;
      key.intensity = config.keyLightIntensity;
      key.position.set(...keyLightPosition(config));
      rim.intensity = config.rimLightIntensity;
      rim.position.set(extent * 1.4, extent * 0.95, -extent * 1.4);
      bounce.intensity = config.bounceLightIntensity;
      bounce.position.set(extent * 0.8, -extent * 0.15, extent * 1.05);

      const half = extent * 1.08;
      const finestCellSpacing = config.detailEnhanceEnabled
        ? config.cellSpacing / 2
        : config.cellSpacing;
      const biasScale = finestCellSpacing / SHADOW_BIAS_REFERENCE_CELL_SPACING;
      key.shadow.bias = SHADOW_BIAS * biasScale;
      key.shadow.normalBias = SHADOW_NORMAL_BIAS * biasScale;
      key.shadow.radius = config.shadowSoftness;
      key.shadow.intensity = config.shadowIntensity;
      key.shadow.camera.left = -half;
      key.shadow.camera.right = half;
      key.shadow.camera.top = half;
      key.shadow.camera.bottom = -half;
      key.shadow.camera.near = 1;
      key.shadow.camera.far = extent * 4.4;
      key.shadow.camera.updateProjectionMatrix();
      key.shadow.needsUpdate = true;
    },
  };
}

// The godray centrepiece, adapted from Windswept's CenterLight: a shadow-
// casting point light with a glowing bead at its position. The shadow
// camera's far plane follows `godraysVolumeSize` rather than three's 500, or
// the fixed shadow-map texel budget flattens the ray attenuation curve.
export function createCenterLight() {
  const group = new THREE.Group();
  const light = new THREE.PointLight();
  light.castShadow = true;
  light.shadow.bias = -0.0005;
  light.shadow.camera.near = 0.05;
  light.shadow.mapSize.set(1024, 1024);

  const material = new THREE.MeshStandardNodeMaterial({
    emissiveIntensity: 3,
    roughness: 0.35,
    toneMapped: false,
  });
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), material);
  group.add(light, bead);

  return {
    group,
    light,

    apply(config, position = config.godraysPosition) {
      light.color.set(config.godraysColor);
      light.intensity = config.godraysIntensity;
      group.position.set(position.x, position.y, position.z);
      light.shadow.camera.far = config.godraysVolumeSize;
      light.shadow.camera.updateProjectionMatrix();
      material.color.set(config.godraysColor);
      material.emissive.set(config.godraysColor);
    },

    dispose() {
      bead.geometry.dispose();
      material.dispose();
    },
  };
}
