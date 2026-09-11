/* eslint-disable camelcase */
import {
  float,
  mix,
  mx_noise_float,
  positionWorld,
  smoothstep,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { RESOLUTION, WORLD_SIZE } from './constants';

export function buildShoreGeometry(heights) {
  const n = RESOLUTION;
  const geometry = new THREE.PlaneGeometry(
    WORLD_SIZE,
    WORLD_SIZE,
    n - 1,
    n - 1
  );
  geometry.rotateX(-Math.PI / 2);

  const { position } = geometry.attributes;
  for (let iy = 0; iy < n; iy += 1) {
    // PlaneGeometry's first row is uv.y = 1, which is the last row of the bed.
    const row = n - 1 - iy;
    for (let ix = 0; ix < n; ix += 1) {
      position.setY(iy * n + ix, heights[row * n + ix]);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildWaterGeometry() {
  const geometry = new THREE.PlaneGeometry(
    WORLD_SIZE,
    WORLD_SIZE,
    RESOLUTION - 1,
    RESOLUTION - 1
  );
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function createShoreMaterial() {
  const uniforms = {
    dryColor: uniform(new THREE.Color('#3b3a38')),
    mottleScale: uniform(0.35),
    roughDry: uniform(0.95),
    roughWet: uniform(0.32),
    wetBand: uniform(1.4),
    wetColor: uniform(new THREE.Color('#0b0d0f')),
    wetLine: uniform(0.6),
  };

  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });

  const wetness = float(1)
    .sub(
      smoothstep(
        uniforms.wetLine.sub(uniforms.wetBand),
        uniforms.wetLine,
        positionWorld.y
      )
    )
    .toVar('wetness');

  const mottle = mx_noise_float(positionWorld.mul(uniforms.mottleScale))
    .mul(0.5)
    .add(0.5);

  material.colorNode = mix(uniforms.dryColor, uniforms.wetColor, wetness).mul(
    mix(float(0.7), float(1.3), mottle)
  );
  material.roughnessNode = mix(uniforms.roughDry, uniforms.roughWet, wetness);

  const update = (config) => {
    uniforms.dryColor.value.set(config.rockDryColor);
    uniforms.mottleScale.value = config.rockMottle;
    uniforms.wetBand.value = config.rockWetBand;
    uniforms.wetColor.value.set(config.rockWetColor);
    uniforms.wetLine.value = config.rockWetLine;
  };

  return { material, update };
}
