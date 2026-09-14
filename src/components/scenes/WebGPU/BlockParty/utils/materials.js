/* eslint-disable no-param-reassign */
import {
  abs,
  float,
  fract,
  instancedBufferAttribute,
  mix,
  normalGeometry,
  positionGeometry,
  step,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import groundTone from './groundPattern';
import { canvasAlpha, isTop, select } from './nodes';
import { applyReveal, flicker, pulse } from './reveal';
import { COLORS, ENUMS, SCALARS } from './uniformDefaults';

const TOWER_RAMP = 0.75;

export const COLOR_KEYS = Object.keys(COLORS);
export const SCALAR_KEYS = Object.keys(SCALARS);
export const ENUM_KEYS = Object.keys(ENUMS);

export function createCityUniforms() {
  return {
    build: uniform(1),
    worldPerPixel: uniform(0.01),
    ...Object.fromEntries(
      COLOR_KEYS.map((key) => [key, uniform(new THREE.Color(COLORS[key]))])
    ),
    ...Object.fromEntries(
      SCALAR_KEYS.map((key) => [key, uniform(SCALARS[key])])
    ),
    ...Object.fromEntries(ENUM_KEYS.map((key) => [key, uniform(0)])),
  };
}

function lit(color) {
  const material = new THREE.MeshLambertNodeMaterial();

  material.colorNode = color;

  return material;
}

export function createGroundMaterial({ uniforms }) {
  return lit(groundTone(uniforms));
}

export function createPedestalMaterial({ uniforms }) {
  return lit(uniforms.pedestalColor);
}

function pivotOf(buffers) {
  return instancedBufferAttribute(buffers.info).xy;
}

export function createCardMaterial({ buffers, uniforms }) {
  const material = lit(
    mix(uniforms.cardEdgeColor, uniforms.cardColor, isTop())
  );

  applyReveal(material, buffers, uniforms, {
    bob: true,
    pivot: pivotOf(buffers),
  });

  return material;
}

export function createNeonMaterial({ buffers, uniforms }) {
  const material = new THREE.MeshBasicNodeMaterial();
  const grow = applyReveal(material, buffers, uniforms, {
    bob: true,
    pivot: pivotOf(buffers),
  });
  const slot = instancedBufferAttribute(buffers.info).z;
  const tint = select(slot, [
    uniforms.neonMagentaColor,
    uniforms.neonCyanColor,
    uniforms.neonAmberColor,
  ]);

  material.colorNode = tint
    .mul(uniforms.neonIntensity)
    .mul(pulse(buffers, uniforms))
    .mul(flicker(buffers, uniforms))
    .mul(grow);

  return material;
}

function inkBlending(material) {
  material.blending = THREE.CustomBlending;
  material.blendEquation = THREE.AddEquation;
  material.blendSrc = THREE.ZeroFactor;
  material.blendDst = THREE.SrcColorFactor;
  material.blendSrcAlpha = THREE.ZeroFactor;
  material.blendDstAlpha = THREE.OneFactor;
}

// Every face is a translucent sweep of the tower's outline, so front and back
// faces both darken what is behind them, and nothing is ever sorted.
export function createTowerMaterial({ blend, buffers, uniforms }) {
  const material = new THREE.MeshBasicNodeMaterial();
  const grow = applyReveal(material, buffers, uniforms, {
    breathe: true,
    stack: true,
  });

  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  const height = positionGeometry.y;
  const face = mix(
    float(0.85),
    float(1),
    step(0.5, abs(normalGeometry.x).max(abs(normalGeometry.y)))
  );
  const band = step(0.5, fract(height.mul(uniforms.towerBanding)));
  const banding = float(1).sub(band.mul(uniforms.towerBandStrength));
  const darkness = height
    .mul(TOWER_RAMP)
    .pow(2)
    .mul(uniforms.towerInk)
    .mul(face)
    .mul(banding)
    .mul(grow)
    .clamp(0, 1);
  const tint = mix(uniforms.towerBaseColor, uniforms.towerColor, height);

  if (blend === 'glow') {
    material.blending = THREE.AdditiveBlending;
    material.colorNode = tint.mul(darkness);
  } else {
    inkBlending(material);
    material.colorNode = mix(vec3(1), tint, canvasAlpha(darkness));
  }

  return material;
}
