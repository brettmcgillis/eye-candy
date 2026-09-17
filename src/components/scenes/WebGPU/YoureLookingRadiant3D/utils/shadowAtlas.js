import {
  Fn,
  If,
  Loop,
  float,
  instanceIndex,
  int,
  ivec2,
  textureStore,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { writeOnly } from '@utils/storageField';

import { ATLAS_COLS, ATLAS_ROWS } from './constants';
import { MISS, octDecode, sphereHit } from './rayTSL';

// Distance from each light to the first occluder in every direction, solved
// per texel exactly as the flat scene's circle trace solves each ray. A light
// sits inside its own body, so its owner is skipped or every ray stops at 0.
export default function createShadowAtlas(u, tileSize) {
  const width = ATLAS_COLS * tileSize;
  const height = ATLAS_ROWS * tileSize;

  const texture = new THREE.StorageTexture(width, height);
  texture.type = THREE.HalfFloatType;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  const kernel = Fn(() => {
    const x = int(instanceIndex.mod(width));
    const y = int(instanceIndex.div(width));
    const tile = vec2(
      float(x).div(tileSize).floor(),
      float(y).div(tileSize).floor()
    );
    const lightIndex = int(tile.y.mul(ATLAS_COLS).add(tile.x));
    const local = vec2(float(x), float(y))
      .sub(tile.mul(tileSize))
      .add(0.5)
      .div(tileSize)
      .mul(2)
      .sub(1);
    const nearest = float(MISS).toVar();

    If(lightIndex.lessThan(u.lightCount), () => {
      const origin = u.lightData.element(lightIndex).xyz;
      const dir = octDecode(local);
      const owner = int(u.lightOwner.element(lightIndex).x);

      Loop({ end: u.solidCount, start: 0, type: 'int' }, ({ i }) => {
        const radius = u.solidInfo.element(i).x;

        If(radius.greaterThan(0).and(i.notEqual(owner)), () => {
          const t = sphereHit(origin, dir, u.solidData.element(i).xyz, radius);
          nearest.assign(nearest.min(t));
        });
      });
    });

    textureStore(writeOnly(texture), ivec2(x, y), vec4(nearest, 0, 0, 1));
  })().compute(width * height);

  // Tiles are row-major, so only the rows holding live lights need solving.
  function setLightCount(count) {
    const rows = Math.max(1, Math.ceil(count / ATLAS_COLS));
    kernel.count = Math.min(rows, ATLAS_ROWS) * tileSize * width;
  }

  return {
    dispose: () => {
      texture.dispose();
      kernel.dispose?.();
    },
    kernel,
    setLightCount,
    texture,
  };
}
