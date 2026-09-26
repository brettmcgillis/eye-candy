/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Changing any of these rebuilds the field's rest pose, so the runtime
// re-runs its init kernel.
export const LAYOUT_KEYS = [
  'fieldLength',
  'fieldWidth',
  'fieldDepth',
  'threadWeave',
  'threadWeaveFrequency',
];

const SCALARS = [
  ...LAYOUT_KEYS,
  'waveFrequency',
  'phaseSpread',
  'clumpSpacing',
  'waveSpeed',
  'waveAmplitude',
  'waveMeander',
  'waveMeanderScale',
  'waveLens',
  'crestThreshold',
  'clump',
  'frizz',
  'frizzScale',
  'flyawayShare',
  'ringSpacing',
  'ringLobes',
  'ringDamp',
  'wavePull',
  'gravity',
  'damping',
  'stiffness',
  'shapeRetention',
  'windStrength',
  'windScale',
  'fiberWidth',
  'minPixels',
  'edgeSoftness',
  'wander',
  'wanderFrequency',
  'iridescence',
  'iridescenceFrequency',
  'specular',
  'shininess',
  'secondarySpecular',
  'diffuse',
  'ambient',
  'backlight',
  'occlusion',
  'occlusionReach',
  'crestShadow',
  'shadowStrength',
  'shadowStep',
  'primaryShift',
  'secondaryShift',
  'transmission',
  'transmissionFocus',
  'plyFrequency',
  'plyDepth',
  'plyGloss',
  'glint',
  'glintScale',
  'depthFade',
  'lightIntensity',
  'lightAzimuth',
  'lightElevation',
];

export const COLORS = [
  'backgroundColor',
  'bandColorA',
  'bandColorB',
  'bandColorC',
  'bandColorD',
  'lightColor',
];

export function createFiberUniforms() {
  const u = {
    phase: uniform(0),
    loopPhase: uniform(0),
    dt: uniform(1 / 60),
    parity: uniform(0),
    lightDirection: uniform(new THREE.Vector3(0, 1, 0)),
    focus: uniform(new THREE.Vector3()),
  };

  SCALARS.forEach((key) => {
    u[key] = uniform(0);
  });
  COLORS.forEach((key) => {
    u[key] = uniform(new THREE.Color());
  });

  return u;
}

export function syncFiberUniforms(u, config) {
  SCALARS.forEach((key) => {
    if (config[key] !== undefined) u[key].value = config[key];
  });
  COLORS.forEach((key) => {
    if (config[key]) u[key].value.setStyle(config[key]);
  });

  u.lightDirection.value.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - config.lightElevation),
    THREE.MathUtils.degToRad(config.lightAzimuth)
  );
  u.focus.value.set(config.lensX, 0, config.lensZ);
}
