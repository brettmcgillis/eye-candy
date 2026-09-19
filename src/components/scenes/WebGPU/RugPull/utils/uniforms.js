/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const LAYOUTS = {
  Fullscreen: 'fullscreen',
  Rug: 'rug',
  Bandana: 'bandana',
  Round: 'round',
};

const LAYOUT_IDS = { rug: 1, bandana: 2, round: 3 };

export const SYMMETRY = { None: 0, Mirror: 1, Kaleido: 2 };

const color = () => uniform(new THREE.Color());

export function createUniforms() {
  return {
    borderWidth: uniform(0.5),
    borderZoom: uniform(1),
    fringeColor: color(),
    fringeDensity: uniform(24),
    fringeLength: uniform(0.4),
    gamma: uniform(1),
    guardColor: color(),
    guardFrequency: uniform(6),
    guardWidth: uniform(0.08),
    halfSize: uniform(new THREE.Vector2(2, 3)),
    inkSteps: uniform(0),
    knotDensity: uniform(0),
    knotShade: uniform(0.3),
    layout: uniform(1, 'int'),
    medallionPetals: uniform(8),
    medallionSize: uniform(0.4),
    meshSize: uniform(new THREE.Vector2(4, 6)),
    palette0: color(),
    palette1: color(),
    palette2: color(),
    palette3: color(),
    paletteMix: uniform(0),
    patternZoom: uniform(1),
    symmetry: uniform(1, 'int'),
    tile: uniform(-1),
    time: uniform(0),
  };
}

export function getTextileSize(c) {
  const width = c.rugWidth;
  if (c.layout === 'rug') {
    return {
      half: [width / 2, c.rugLength / 2],
      mesh: [width, c.rugLength + c.fringeLength * 2],
    };
  }
  return { half: [width / 2, width / 2], mesh: [width, width] };
}

export function syncUniforms(u, c, time) {
  const { half, mesh } = getTextileSize(c);

  u.time.value = time;
  u.layout.value = LAYOUT_IDS[c.layout] ?? 1;
  u.halfSize.value.set(...half);
  u.meshSize.value.set(...mesh);

  u.patternZoom.value = c.patternZoom;
  u.tile.value = c.tile;
  u.borderZoom.value = c.borderZoom;
  u.symmetry.value = c.symmetry;
  u.borderWidth.value = c.borderWidth;
  u.guardWidth.value = c.guardWidth;
  u.guardFrequency.value = c.guardFrequency;
  u.medallionSize.value = c.medallionSize;
  u.medallionPetals.value = c.medallionPetals;
  u.knotDensity.value = c.knotDensity;
  u.knotShade.value = c.knotShade;
  u.fringeLength.value = c.fringeLength;
  u.fringeDensity.value = c.fringeDensity;

  u.paletteMix.value = c.paletteMix;
  u.inkSteps.value = c.inkSteps;
  u.gamma.value = c.gamma;
  u.guardColor.value.setStyle(c.guardColor, THREE.LinearSRGBColorSpace);
  u.fringeColor.value.setStyle(c.fringeColor, THREE.LinearSRGBColorSpace);
  u.palette0.value.setStyle(c.palette0, THREE.LinearSRGBColorSpace);
  u.palette1.value.setStyle(c.palette1, THREE.LinearSRGBColorSpace);
  u.palette2.value.setStyle(c.palette2, THREE.LinearSRGBColorSpace);
  u.palette3.value.setStyle(c.palette3, THREE.LinearSRGBColorSpace);
}
