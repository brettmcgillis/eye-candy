/* eslint-disable camelcase */
import {
  abs,
  cos,
  mix,
  mx_fractal_noise_float,
  mx_noise_float,
  mx_worley_noise_vec2,
  positionWorld,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { ROAD_BEARING, ROAD_WIDTH, groundAt } from '@modules/brutalist';

const RINGS = 150;
const SEGMENTS = 240;
const REACH = 3;

export function createGroundUniforms() {
  return {
    color: uniform(new THREE.Color('#353628')),
    moss: uniform(new THREE.Color('#4b5a2a')),
    roadStart: uniform(40),
  };
}

export function applyGround(uniforms, config) {
  uniforms.color.value.set(config.groundColor);
  uniforms.moss.value.set(config.mossColor);
}

// A polar grid, dense at the structure's foot and stretched toward the
// horizon, lifted by the kernel's groundAt so trees and terrain agree.
export function buildGroundGeometry(config, foot) {
  const outer = config.forestRadius * REACH + 800;
  const positions = [];
  const index = [];
  positions.push(0, groundAt(0, 0, config, foot), 0);
  for (let i = 1; i <= RINGS; i += 1) {
    const r = outer * (i / RINGS) ** 2.3;
    for (let j = 0; j < SEGMENTS; j += 1) {
      const a = (j / SEGMENTS) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, groundAt(x, z, config, foot), z);
    }
  }
  const at = (i, j) => 1 + (i - 1) * SEGMENTS + (j % SEGMENTS);
  for (let j = 0; j < SEGMENTS; j += 1) index.push(0, at(1, j + 1), at(1, j));
  for (let i = 1; i < RINGS; i += 1) {
    for (let j = 0; j < SEGMENTS; j += 1) {
      index.push(at(i, j), at(i, j + 1), at(i + 1, j));
      index.push(at(i, j + 1), at(i + 1, j + 1), at(i + 1, j));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

// Forest floor: litter and moss in patches, and the old road, its asphalt
// broken into plates with moss in every crack.
export function createGroundMaterial(uniforms) {
  const p = positionWorld;
  const b = (ROAD_BEARING * Math.PI) / 180;
  const along = p.x.mul(cos(b)).add(p.z.mul(sin(b)));
  const across = abs(p.x.mul(-Math.sin(b)).add(p.z.mul(Math.cos(b))));
  const edgeNoise = mx_noise_float(vec2(along.mul(0.15), 3.3)).mul(1.2);
  const road = smoothstep(
    ROAD_WIDTH / 2 + 0.6,
    ROAD_WIDTH / 2 - 0.8,
    across.add(edgeNoise)
  ).mul(smoothstep(uniforms.roadStart, uniforms.roadStart.add(4), along));
  const patches = mx_fractal_noise_float(vec3(p.x, 0, p.z).mul(0.05), 4)
    .mul(0.5)
    .add(0.5);
  const fine = mx_noise_float(vec3(p.x, 0, p.z).mul(1.7))
    .mul(0.5)
    .add(0.5);
  const floor = mix(
    uniforms.color.mul(0.75),
    uniforms.color.mul(1.25),
    patches
  ).mul(fine.mul(0.25).add(0.85));
  const mossy = mix(
    floor,
    uniforms.moss.mul(0.8),
    smoothstep(0.55, 0.8, patches).mul(0.6)
  );
  const cells = mx_worley_noise_vec2(vec2(along, across).mul(0.45));
  const cracks = smoothstep(0.09, 0.0, cells.y.sub(cells.x));
  const asphalt = mix(
    vec3(0.16, 0.155, 0.15),
    uniforms.moss.mul(0.7),
    cracks.max(smoothstep(0.6, 0.85, patches))
  );
  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.colorNode = mix(mossy, asphalt.mul(fine.mul(0.2).add(0.9)), road);
  material.roughnessNode = mix(1, 0.85, road);
  return material;
}
