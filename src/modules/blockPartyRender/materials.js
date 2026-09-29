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
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import groundTone from './groundPattern';
import { canvasAlpha, cellTint, isTop, select } from './nodes';
import { applyReveal, flicker, pulse } from './reveal';

const TOWER_RAMP = 0.75;
const CARD_EDGE_SHADE = 0.85;

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
  const cell = cellTint(buffers, uniforms, 'cellCards');
  const top = mix(uniforms.cardColor, cell.color, cell.amount);
  const edge = mix(
    uniforms.cardEdgeColor,
    cell.color.mul(CARD_EDGE_SHADE),
    cell.amount
  );
  const material = lit(mix(edge, top, isTop()));

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
  const cell = cellTint(buffers, uniforms, 'cellAccents');
  const tint = mix(
    select(slot, [
      uniforms.neonMagentaColor,
      uniforms.neonCyanColor,
      uniforms.neonAmberColor,
    ]),
    cell.color,
    cell.amount
  );

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
  const cell = cellTint(buffers, uniforms, 'cellTowers');
  const tint = mix(
    mix(uniforms.towerBaseColor, uniforms.towerColor, height),
    cell.color,
    cell.amount
  );

  if (blend === 'glow') {
    material.blending = THREE.AdditiveBlending;
    material.colorNode = tint.mul(darkness);
  } else {
    inkBlending(material);
    material.colorNode = mix(vec3(1), tint, canvasAlpha(darkness));
  }

  return material;
}
