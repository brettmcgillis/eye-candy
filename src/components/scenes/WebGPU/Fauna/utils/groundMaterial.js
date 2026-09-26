import {
  abs,
  float,
  fract,
  max,
  mix,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { FOOD_RES } from '@modules/fauna';

export function createFoodTexture() {
  const food = new THREE.DataTexture(
    new Uint8Array(FOOD_RES * FOOD_RES * 4),
    FOOD_RES,
    FOOD_RES,
    THREE.RGBAFormat
  );

  food.magFilter = THREE.LinearFilter;
  food.minFilter = THREE.LinearFilter;
  food.needsUpdate = true;

  return food;
}

export function writeFood(food, plant, meat) {
  const { data } = food.image;

  for (let i = 0; i < plant.length; i += 1) {
    data[i * 4] = Math.min(255, plant[i] * 255);
    data[i * 4 + 1] = Math.min(255, meat[i] * 180);
    data[i * 4 + 3] = 255;
  }

  food.needsUpdate = true; // eslint-disable-line no-param-reassign
}

export function createGroundUniforms() {
  return {
    backgroundColor: uniform(new THREE.Color()),
    grid: uniform(0.35),
    lab: uniform(1),
    meatColor: uniform(new THREE.Color()),
    mossColor: uniform(new THREE.Color()),
    soilColor: uniform(new THREE.Color()),
    worldSize: uniform(48),
  };
}

export function createGroundMaterial(food, u) {
  const material = new THREE.MeshStandardNodeMaterial();
  const uv = positionWorld.xz.div(u.worldSize).add(0.5);
  const sample = texture(food, vec2(uv.x, uv.y));
  const inside = max(abs(uv.x.sub(0.5)), abs(uv.y.sub(0.5)));
  const cells = fract(uv.mul(FOOD_RES)).sub(0.5).abs();
  const line = smoothstep(0.44, 0.5, max(cells.x, cells.y)).mul(u.grid);
  const moss = mix(u.soilColor, u.mossColor, smoothstep(0.02, 0.9, sample.r));
  const stained = mix(moss, u.meatColor, smoothstep(0.02, 0.6, sample.g));
  const world = stained.mul(line.mul(-0.35).add(1));
  const edge = smoothstep(0.5, 0.62, inside);
  const labRadius = positionWorld.xz.length().div(u.worldSize.mul(0.18));
  const field = mix(world, u.soilColor, u.lab);
  const fade = mix(edge, smoothstep(0.6, 1.4, labRadius), u.lab);

  material.colorNode = mix(field, u.backgroundColor, fade);
  material.roughnessNode = float(0.95);
  material.metalnessNode = float(0);

  return material;
}
