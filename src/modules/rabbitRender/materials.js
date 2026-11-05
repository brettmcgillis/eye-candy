/* eslint-disable camelcase */
import {
  Fn,
  attribute,
  color,
  dot,
  float,
  min,
  mix,
  mx_noise_float,
  normalLocal,
  positionGeometry,
  positionLocal,
  pow,
  smoothstep,
  texture,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_ARROWS } from '@modules/rabbit';

import { EYE_ATTRIBUTE, FUR_ATTRIBUTE } from './furMask';

export const WOUND_SLOTS = MAX_ARROWS;

const FUR_WHITE = color('#f6f3ed');
const FUR_SHADE = color('#c2bdb6');
const SKIN_PINK = color('#e3a4a2');
const EYE_DARK = color('#121010');
const EYE_ROUGHNESS = 0.3;
const BLOOM_WASH = color('#d9838c');
const BLOOM_CORE = color('#9c2132');
const RIBBON = color('#ee8a8f');
const RIBBON_EDGE = color('#cf5661');

export function createWoundUniforms() {
  return {
    points: Array.from({ length: WOUND_SLOTS }, () =>
      uniform(new THREE.Vector4(0, -1e4, 0, 1))
    ),
    strength: uniform(1),
  };
}

// Fur only where the mesh's furDensity says skin (./furMask).
export function createFurDensity() {
  return attribute(FUR_ATTRIBUTE, 'float');
}

const eyeMask = () => attribute(EYE_ATTRIBUTE, 'float');

// The photographic hare texture repainted as the painting's white rabbit:
// luminance only survives as faint grey fur detail, pink skin stays pink,
// the eye pieces are black beads (their brown iris would read as fur). Wounds stain the rest-pose skin, so they ride it.
// Shared by the body and its shell fur.
export function createSkinColor(map, wounds) {
  return Fn(() => {
    const sample = pow(texture(map, uv()).rgb, vec3(1 / 2.2));
    const lum = dot(sample, vec3(0.299, 0.587, 0.114));
    const fur = mix(FUR_SHADE, FUR_WHITE, smoothstep(0.08, 0.42, lum));
    const pink = smoothstep(0.1, 0.22, sample.r.sub(sample.g));
    const eye = smoothstep(0.13, 0.06, lum);
    const skin = mix(mix(fur, SKIN_PINK, pink.mul(0.85)), EYE_DARK, eye);

    const ragged = mx_noise_float(positionGeometry.mul(0.45))
      .mul(0.3)
      .add(mx_noise_float(positionGeometry.mul(1.6)).mul(0.12));
    const reach = float(1e4).toVar();
    wounds.points.forEach((point) => {
      reach.assign(
        min(reach, positionGeometry.sub(point.xyz).length().div(point.w))
      );
    });
    const d = reach.add(ragged);
    const wash = smoothstep(1, 0.55, d);
    const core = smoothstep(0.55, 0.05, d);
    const tide = smoothstep(0.75, 0.6, d).sub(smoothstep(0.6, 0.45, d));
    const stained = mix(
      mix(skin, BLOOM_WASH, wash.mul(0.75)),
      BLOOM_CORE,
      core.add(tide.mul(0.35)).clamp(0, 1)
    );
    return mix(mix(skin, stained, wounds.strength), EYE_DARK, eyeMask());
  })();
}

export function createFurMaterial(original, wounds) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.92,
    side: THREE.DoubleSide,
  });
  material.colorNode = vec4(createSkinColor(original.map, wounds), 1);
  material.roughnessNode = mix(float(0.92), float(EYE_ROUGHNESS), eyeMask());
  return material;
}

// Inverted hull: back faces only, pushed out along the normal by `width`
// (in the mesh's own units).
export function createOutlineMaterial({ color: ink, width }) {
  const material = new THREE.MeshBasicNodeMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
    side: THREE.BackSide,
  });
  material.colorNode = ink;
  material.positionNode = positionLocal.add(normalLocal.toVar().mul(width));
  material.fog = false;
  return material;
}

// Satin: soft sheen, a little deeper at the edges where it turns. `uv.y`
// runs across the ribbon on both the hanging tail and the wrap.
export function createRibbonMaterial() {
  const material = new THREE.MeshPhysicalNodeMaterial({
    roughness: 0.5,
    sheen: 0.3,
    sheenColor: new THREE.Color('#ffb0b4'),
    sheenRoughness: 0.35,
    side: THREE.DoubleSide,
  });
  material.colorNode = mix(
    RIBBON,
    RIBBON_EDGE,
    smoothstep(0.32, 0.5, uv().y.sub(0.5).abs())
  );
  return material;
}
