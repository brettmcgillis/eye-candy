/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

const CONCRETE = 'apparitions/concrete_0016';
const STONE = 'houseOfLeaves/stone';

export const SURFACES = {
  Wood: { color: textureFile('wood_table_diff_1k.jpg') },
  Concrete: {
    ao: textureFile(`${CONCRETE}_ao_1k.jpg`),
    color: textureFile(`${CONCRETE}_color_1k.jpg`),
    normal: textureFile(`${CONCRETE}_normal_opengl_1k.png`),
    roughness: textureFile(`${CONCRETE}_roughness_1k.jpg`),
  },
  Stone: {
    ao: textureFile(`${STONE}/ao.jpg`),
    color: textureFile(`${STONE}/albedo.jpg`),
    normal: textureFile(`${STONE}/normal.jpg`),
    roughness: textureFile(`${STONE}/roughness.jpg`),
  },
  Asphalt: {
    color: textureFile('asphalt/asphalt_02_diff_1k.jpg'),
    roughness: textureFile('asphalt/asphalt_02_rough_1k.jpg'),
  },
  Plain: {},
};

export const SURFACE_NAMES = Object.keys(SURFACES);
export const MAP_SLOTS = ['color', 'normal', 'roughness', 'ao'];

export const SURFACE_URLS = [
  ...new Set(Object.values(SURFACES).flatMap((maps) => Object.values(maps))),
];

function solid(rgba, colorSpace) {
  const texture = new THREE.DataTexture(new Uint8Array(rgba), 1, 1);
  texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createNeutralMaps() {
  return {
    ao: solid([255, 255, 255, 255], THREE.NoColorSpace),
    color: solid([255, 255, 255, 255], THREE.SRGBColorSpace),
    normal: solid([128, 128, 255, 255], THREE.NoColorSpace),
    roughness: solid([255, 255, 255, 255], THREE.NoColorSpace),
  };
}

export function configureSurfaceTexture(texture, slot) {
  texture.colorSpace =
    slot === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
}
