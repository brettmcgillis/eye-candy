/* eslint-disable camelcase, no-param-reassign */
import {
  cameraViewMatrix,
  mix,
  mx_fractal_noise_float,
  normalWorldGeometry,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAP_SLOTS } from './surfaces';

export function createSurfaceUniforms() {
  return {
    aoStrength: uniform(1),
    grimeColor: uniform(new THREE.Color('#3b352d')),
    grimeScale: uniform(1.5),
    grimeStreaks: uniform(4),
    normalStrength: uniform(1),
    roughness: uniform(0.6),
    textureScale: uniform(2),
    textureStrength: uniform(1),
    weathering: uniform(0),
  };
}

// Box faces are axis aligned, so triplanar weights are effectively one-hot and
// each face gets a plain planar projection. Every sample node is kept so a
// surface switch swaps texture values instead of recompiling the material.
export function createSurfaceNodes({ maps, uniforms: u }) {
  const samplers = Object.fromEntries(MAP_SLOTS.map((slot) => [slot, []]));
  const weights = normalWorldGeometry.abs().toVar();
  const axisWeights = [weights.x, weights.y, weights.z];
  const p = positionWorld.mul(u.textureScale);
  const planes = [p.yz, p.zx, p.xy];

  const sample = (slot, uvNode) => {
    const node = texture(maps[slot], uvNode);
    samplers[slot].push(node);
    return node;
  };
  const triplanar = (slot) =>
    planes
      .map((plane, axis) => sample(slot, plane).mul(axisWeights[axis]))
      .reduce((sum, term) => sum.add(term));

  const grime = mx_fractal_noise_float(
    positionWorld
      .mul(vec3(1, u.grimeStreaks.reciprocal(), 1))
      .mul(u.grimeScale),
    4,
    2,
    0.5
  );
  const grimeMask = smoothstep(0.1, 0.6, grime.mul(0.5).add(0.5))
    .mul(u.weathering)
    .toVar();

  const albedo = mix(vec3(1), triplanar('color').rgb, u.textureStrength);
  const ao = mix(1, triplanar('ao').r, u.aoStrength);

  const tangents = [
    [vec3(0, 1, 0), vec3(0, 0, 1)],
    [vec3(0, 0, 1), vec3(1, 0, 0)],
    [vec3(1, 0, 0), vec3(0, 1, 0)],
  ];
  const bump = planes
    .map((plane, axis) => {
      const tn = sample('normal', plane).xy.mul(2).sub(1);
      const [t, b] = tangents[axis];
      return t.mul(tn.x).add(b.mul(tn.y)).mul(axisWeights[axis]);
    })
    .reduce((sum, term) => sum.add(term));
  const worldNormal = normalWorldGeometry
    .add(bump.mul(u.normalStrength))
    .normalize();

  return {
    applyAlbedo: (color) =>
      mix(albedo.mul(color), u.grimeColor, grimeMask).mul(ao),
    normalView: cameraViewMatrix.mul(vec4(worldNormal, 0)).xyz.normalize(),
    roughness: triplanar('roughness')
      .r.mul(u.roughness)
      .add(grimeMask.mul(0.3))
      .min(1),
    setMaps(next) {
      MAP_SLOTS.forEach((slot) => {
        samplers[slot].forEach((node) => {
          node.value = next[slot];
        });
      });
    },
  };
}
