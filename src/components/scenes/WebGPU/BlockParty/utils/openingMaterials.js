/* eslint-disable no-param-reassign */
import {
  abs,
  float,
  fwidth,
  instancedBufferAttribute,
  mix,
  normalGeometry,
  positionGeometry,
  smoothstep,
  step,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import groundTone from './groundPattern';
import { canvasAlpha, isTop } from './nodes';
import { applyReveal, pulse } from './reveal';

const RING_COUNT = 10;

function interior() {
  const material = new THREE.MeshBasicNodeMaterial();

  material.side = THREE.BackSide;

  return material;
}

function closeOver(material, color, grow, uniforms) {
  material.colorNode = mix(groundTone(uniforms), color, grow);
}

function isFloor() {
  return normalGeometry.y.lessThan(-0.5);
}

// Depth is in layers measured down from the rim. Every whole layer is a line
// on the wall that fades `0.8 - i / 10`, the reference's ring stroke.
function strata(depth, uniforms) {
  const index = depth.round();
  const distance = abs(depth.sub(index));
  const edge = uniforms.pitLineWidth;
  const line = float(1)
    .sub(smoothstep(edge, edge.add(fwidth(depth)), distance))
    .mul(step(0.5, index));
  const fade = float(0.8).sub(index.sub(1).div(RING_COUNT)).clamp(0, 1);
  const wall = mix(uniforms.pitRimColor, uniforms.pitColor, step(1, depth));

  return { fade, line, wall };
}

function wallTone(depth, glow, buffers, uniforms) {
  const { fade, line, wall } = strata(depth, uniforms);

  if (glow) {
    const ring = uniforms.ringColor
      .mul(uniforms.ringIntensity)
      .mul(pulse(buffers, uniforms));

    return mix(wall, ring, line.mul(fade));
  }

  return mix(
    wall,
    uniforms.pitStrataColor,
    line.mul(fade).mul(uniforms.pitStrataStrength)
  );
}

function createShaft({ buffers, glow, uniforms }) {
  const material = interior();
  const grow = applyReveal(material, buffers, uniforms, { sink: true });
  const layers = instancedBufferAttribute(buffers.info).x;
  const depth = positionGeometry.y.negate().mul(layers);
  const floor = glow ? uniforms.glowFloorColor : uniforms.pitFloorColor;

  closeOver(
    material,
    mix(wallTone(depth, glow, buffers, uniforms), floor, isFloor()),
    grow,
    uniforms
  );

  return material;
}

export function createPitMaterial(options) {
  return createShaft({ ...options, glow: false });
}

export function createGlowPitMaterial(options) {
  return createShaft({ ...options, glow: true });
}

function createTerrace({ buffers, glow, uniforms }) {
  const material = new THREE.MeshBasicNodeMaterial();
  const info = instancedBufferAttribute(buffers.info);
  const layers = info.x;
  const layer = info.y;
  const grow = applyReveal(material, buffers, uniforms, {
    sequence: { count: layers, index: layer },
    sink: true,
  });
  const depth = layers.sub(positionGeometry.y.mul(layers.sub(layer)));
  const wall = wallTone(depth, glow, buffers, uniforms);

  closeOver(material, mix(wall, uniforms.pitColor, isTop()), grow, uniforms);

  return material;
}

export function createTerraceMaterial(options) {
  return createTerrace({ ...options, glow: false });
}

export function createGlowTerraceMaterial(options) {
  return createTerrace({ ...options, glow: true });
}

export function createWellMaterial({ buffers, uniforms }) {
  const material = interior();
  const grow = applyReveal(material, buffers, uniforms, { sink: true });
  const depth = positionGeometry.y.negate().mul(uniforms.wellFalloff);
  const wall = mix(uniforms.wellWallColor, uniforms.stairLowColor, depth);

  closeOver(
    material,
    mix(wall, uniforms.wellFloorColor, isFloor()),
    grow,
    uniforms
  );

  return material;
}

export function createTaperWallMaterial({ buffers, uniforms }) {
  const material = new THREE.MeshBasicNodeMaterial();
  const grow = applyReveal(material, buffers, uniforms, { sink: true });
  const depth = float(1).sub(positionGeometry.y).mul(uniforms.wellFalloff);
  const side = mix(uniforms.wellWallColor, uniforms.stairLowColor, depth);

  closeOver(material, mix(side, groundTone(uniforms), isTop()), grow, uniforms);

  return material;
}

// Each tread is filled black at `a += 0.15`, so a short flight stays grey and
// a long one is solid black partway down.
export function createStepMaterial({ buffers, uniforms }) {
  const material = new THREE.MeshBasicNodeMaterial();
  const info = instancedBufferAttribute(buffers.info);
  const grow = applyReveal(material, buffers, uniforms, {
    sequence: { count: info.y, index: info.x },
    sink: true,
  });
  const alpha = canvasAlpha(uniforms.stairAlphaStep.mul(info.x).clamp(0, 1));
  const tone = mix(uniforms.stairHighColor, uniforms.stairLowColor, alpha);

  closeOver(
    material,
    mix(tone.mul(uniforms.riserShade), tone, isTop()),
    grow,
    uniforms
  );

  return material;
}
