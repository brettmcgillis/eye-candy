/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

const SCALARS = [
  'tintVariance',
  'greenReach',
  'tipAmount',
  'tipPower',
  'stemWidth',
  'tipWidth',
  'thicknessCurve',
  'leafWidth',
  'leafFlatness',
  'minPixels',
  'roughness',
  'occlusion',
  'cardCup',
  'windStrength',
  'windSpeed',
  'scatterDistance',
  'scatterLift',
  'scatterSpread',
  'scatterTurbulence',
  'scatterSpin',
  'ornamentScale',
  'ornamentMinPixels',
];

const COLORS = [
  'stemColor',
  'budColor',
  'crownColor',
  'accentColor',
  'tipColor',
  'ornamentColor',
];

export function createUniforms() {
  const u = {
    bloom: uniform(0),
    center: uniform(new THREE.Vector3(0, 8, 0)),
    exit: uniform(0),
    growth: uniform(0),
  };

  SCALARS.forEach((key) => {
    u[key] = uniform(0);
  });
  COLORS.forEach((key) => {
    u[key] = uniform(new THREE.Color());
  });

  return u;
}

export function syncUniforms(u, config) {
  SCALARS.forEach((key) => {
    if (config[key] !== undefined) {
      u[key].value = config[key];
    }
  });
  COLORS.forEach((key) => {
    if (config[key]) {
      u[key].value.set(config[key]);
    }
  });
}

export function syncSpecimen(u, specimen) {
  u.center.value.fromArray(specimen.center);
}
