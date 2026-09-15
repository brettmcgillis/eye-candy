/* eslint-disable no-param-reassign */
import {
  float,
  hash,
  int,
  log,
  mix,
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

// Per-box values are resolved in the vertex stage, but the palette lookup
// happens in the fragment stage: a texture sampled in the vertex stage leaves
// its binding undeclared for the fragment shader and the pipeline fails.
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

  const paletteCoordinate = ({ center, id, radius }) => {
    const byId = float(seeded(id)).mul(0.6180339).fract();
    const byHeight = center.y.div(u.rootRadius.y.mul(2)).add(0.5);
    const bySize = log(radius.length().div(u.rootRadius.length()))
      .div(log(u.sizeFloor))
      .oneMinus();
    const byRandom = hash(seeded(id));

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
    )
      .mul(u.paletteRepeat)
      .add(u.paletteShift);
  };

  const samplePalette = (coordinate) => {
    const node = texture(paletteTexture, vec2(coordinate, 0.5)).level(0);
    samplers.push(node);
    return node.rgb;
  };

  // `from` and `to` are the two tree levels Grow is blending between.
  const boxColor = ({ blend, from, to }) => {
    const direct = mix(directColor(from.id), directColor(to.id), blend);
    const fromCoordinate = paletteCoordinate(from).toVarying('vPaletteFrom');
    const toCoordinate = paletteCoordinate(to).toVarying('vPaletteTo');
    const paletteBlend = float(blend).toVarying('vPaletteBlend');

    return select(
      u.colorMode.equal(int(COLOR_MODES.palette)),
      mix(
        samplePalette(fromCoordinate),
        samplePalette(toCoordinate),
        paletteBlend
      ),
      direct.toVarying('vDirectColor')
    );
  };

  return {
    boxColor,
    setPalette(next) {
      samplers.forEach((node) => {
        node.value = next;
      });
    },
  };
}
