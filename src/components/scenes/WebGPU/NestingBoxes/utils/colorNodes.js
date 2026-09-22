/* eslint-disable no-param-reassign */
import {
  float,
  hash,
  int,
  log,
  select,
  texture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { sinShifted, wrappedAngle } from './treeCompute';

export const COLOR_MODES = { tint: 0, solid: 1, palette: 2 };
export const PALETTE_SOURCES = { id: 0, height: 1, size: 2, random: 3 };

export function createColorUniforms() {
  return {
    baseColor: uniform(new THREE.Color('#d8d4cc')),
    colorMode: uniform(0, 'int'),
    identityLevel: uniform(4, 'uint'),
    paletteRepeat: uniform(1),
    paletteShift: uniform(0),
    paletteSource: uniform(0, 'int'),
    rootRadius: uniform(new THREE.Vector3(4, 2, 4)),
    sizeFloor: uniform(0.02),
    tintAmplitude: uniform(0.45),
    tintBase: uniform(0.55),
    seed: uniform(0, 'uint'),
    tintFrequency: uniform(0.5),
    tintPhase: uniform(new THREE.Vector3(0, 0.5, 1)),
  };
}

// Every colour decision happens in the fragment stage: the vertex output budget
// is tight (fog, shadows and the surface maps share it), and a texture sampled
// in the vertex stage leaves its binding undeclared for the fragment shader.
export function createColorNodes({ paletteTexture, uniforms: u }) {
  const samplers = [];

  const seeded = (id) => id.add(u.seed);

  const directColor = (id) =>
    select(
      u.colorMode.equal(int(COLOR_MODES.tint)),
      sinShifted(vec3(wrappedAngle(seeded(id), u.tintFrequency)), u.tintPhase)
        .mul(u.tintAmplitude)
        .add(u.tintBase),
      vec3(u.baseColor)
    );

  // One coordinate per building, so a whole branch of the tree reads as one
  // structure instead of re-rolling every time growth subdivides it.
  const identityCoordinate = (id) =>
    float(seeded(id))
      .mul(0.6180339)
      .fract()
      .mul(u.paletteRepeat)
      .add(u.paletteShift);

  const paletteCoordinate = ({ anchorId, center, radius }) => {
    const byId = identityCoordinate(anchorId);
    const byHeight = center.y
      .div(u.rootRadius.y.mul(2))
      .add(0.5)
      .mul(u.paletteRepeat)
      .add(u.paletteShift);
    const bySize = log(radius.length().div(u.rootRadius.length()))
      .div(log(u.sizeFloor))
      .oneMinus()
      .mul(u.paletteRepeat)
      .add(u.paletteShift);
    const byRandom = hash(seeded(anchorId));

    return select(
      u.paletteSource.equal(int(PALETTE_SOURCES.id)),
      byId,
      select(
        u.paletteSource.equal(int(PALETTE_SOURCES.height)),
        byHeight,
        select(
          u.paletteSource.equal(int(PALETTE_SOURCES.size)),
          bySize,
          byRandom
        )
      )
    );
  };

  const samplePalette = (coordinate) => {
    const node = texture(paletteTexture, vec2(coordinate, 0.5)).level(0);
    samplers.push(node);
    return node.rgb;
  };

  // Tint and palette-by-building key off `anchorId`, the building this box
  // belongs to, so they survive growth untouched. The height and size sources
  // vary per box, but they read the box's blended centre and radius, so they
  // move smoothly rather than snapping.
  const boxColor = (box) =>
    select(
      u.colorMode.equal(int(COLOR_MODES.palette)),
      samplePalette(paletteCoordinate(box)),
      directColor(box.anchorId)
    );

  // The building's own colour, used to keep window light in the same palette as
  // the structure it sits in.
  const buildingColor = (anchorId) =>
    select(
      u.colorMode.equal(int(COLOR_MODES.palette)),
      samplePalette(identityCoordinate(anchorId)),
      directColor(anchorId)
    );

  return {
    boxColor,
    buildingColor,
    setPalette(next) {
      samplers.forEach((node) => {
        node.value = next;
      });
    },
  };
}
