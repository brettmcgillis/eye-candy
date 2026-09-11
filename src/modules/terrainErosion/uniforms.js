import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  EROSION_DEFAULTS,
  HEIGHT_DEFAULTS,
  PALETTE,
  TERRAIN_DEFAULTS,
} from './constants';

const d = EROSION_DEFAULTS;
const h = HEIGHT_DEFAULTS;
const t = TERRAIN_DEFAULTS;

export function createFieldUniforms() {
  return {
    assumedSlope: uniform(
      new THREE.Vector2(d.assumedSlope, d.assumedSlopeAmount)
    ),
    cellScale: uniform(d.cellScale),
    detail: uniform(d.detail),
    domeAmplitude: uniform(0.1),
    domeRadius: uniform(0.35),
    gain: uniform(d.gain),
    gullyWeight: uniform(d.gullyWeight),
    heightAmplitude: uniform(h.amplitude),
    heightFrequency: uniform(h.frequency),
    heightGain: uniform(h.gain),
    heightLacunarity: uniform(h.lacunarity),
    heightOctaves: uniform(h.octaves, 'int'),
    heightOffset: uniform(
      new THREE.Vector2(d.heightOffset, d.heightOffsetFade)
    ),
    lacunarity: uniform(d.lacunarity),
    normalization: uniform(d.normalization),
    octaves: uniform(d.octaves, 'int'),
    onset: uniform(
      new THREE.Vector4(
        d.onsetInput,
        d.onsetOctave,
        d.onsetRidgeInput,
        d.onsetRidgeOctave
      )
    ),
    rounding: uniform(
      new THREE.Vector4(
        d.ridgeRounding,
        d.creaseRounding,
        d.roundingInput,
        d.roundingOctave
      )
    ),
    scale: uniform(d.scale),
    scrollFrac: uniform(new THREE.Vector2()),
    scrollInt: uniform(new THREE.Vector2()),
    strength: uniform(d.strength),
    // Trees and water feed the tree mask inside the field itself, so the bake
    // needs them even when nothing is being shaded yet.
    grassHeight: uniform(t.grassHeight),
    treesEnabled: uniform(t.trees ? 1 : 0),
    waterEnabled: uniform(t.water ? 1 : 0),
    waterHeight: uniform(t.waterHeight),
  };
}

export function createShadingUniforms() {
  const color = (hex) =>
    uniform(new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace));

  return {
    ambientColor: color(PALETTE.ambient),
    ambientIntensity: uniform(0.1),
    cliffColor: color(PALETTE.cliff),
    detailAmount: uniform(1),
    dirtColor: color(PALETTE.dirt),
    drainageEnabled: uniform(t.drainage ? 1 : 0),
    drainageWidth: uniform(t.drainageWidth),
    grass1Color: color(PALETTE.grass1),
    grass2Color: color(PALETTE.grass2),
    sandColor: color(PALETTE.sand),
    shadowsEnabled: uniform(1),
    sunColor: color(PALETTE.sun),
    sunDirection: uniform(new THREE.Vector3(-1, 0.4, 0.05).normalize()),
    sunIntensity: uniform(2),
    treeColor: color(PALETTE.tree),
    waterShoreColor: color(PALETTE.waterShore),
    waterColor: color(PALETTE.water),
  };
}

// Leva hands colours over as hex strings that are already linear triples in the
// reference's palette, so they go in unconverted.
export function setColor(target, hex) {
  target.value.setStyle(hex, THREE.LinearSRGBColorSpace);
}
