/* eslint-disable no-param-reassign */
import {
  Fn,
  cameraPosition,
  clamp,
  dot,
  float,
  floor,
  int,
  max,
  mix,
  normalize,
  positionWorld,
  pow,
  reflect,
  smoothstep,
  storage,
  uniform,
  varyingProperty,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createTubeMaterial } from '@modules/gpuTubes';

export const GROWTH_UNIFORM_KEYS = [
  'dgCurvatureBias',
  'dgCurvatureContrast',
  'dgEdgeLength',
  'dgFresnel',
  'dgSpecular',
  'dgTubeRadius',
];
export const GROWTH_COLOR_KEYS = ['dgGradientStart', 'dgGradientEnd'];

export function createGrowthUniforms() {
  const uniforms = { count: uniform(0) };
  GROWTH_UNIFORM_KEYS.forEach((key) => {
    uniforms[key] = uniform(0);
  });
  GROWTH_COLOR_KEYS.forEach((key) => {
    uniforms[key] = uniform(new THREE.Color());
  });
  return uniforms;
}

export function syncGrowthUniforms(uniforms, config) {
  GROWTH_UNIFORM_KEYS.forEach((key) => {
    uniforms[key].value = config[key];
  });
  GROWTH_COLOR_KEYS.forEach((key) => {
    uniforms[key].value.set(config[key]);
  });
}

// Catmull-Rom around a closed loop whose point count changes every frame.
function loopSampler(buffer, count) {
  const at = (i) => buffer.element(int(i.mod(count)));
  return Fn(([t]) => {
    const f = t.fract().mul(count);
    const i1 = floor(f);
    const u = f.sub(i1);
    const p0 = at(i1.sub(1).add(count));
    const p1 = at(i1);
    const p2 = at(i1.add(1));
    const p3 = at(i1.add(2));
    const u2 = u.mul(u);
    return p1
      .mul(2)
      .add(p2.sub(p0).mul(u))
      .add(p0.mul(2).sub(p1.mul(5)).add(p2.mul(4)).sub(p3).mul(u2))
      .add(p0.negate().add(p1.mul(3)).sub(p2.mul(3)).add(p3).mul(u2.mul(u)))
      .mul(0.5);
  });
}

// One lit tube along the growing loop, shaded the way DifferentialLayers
// shades its ribbons: a curvature gradient under two fixed lights with wrap
// diffuse, specular and fresnel.
export default function createGrowthMaterial({
  frameMode,
  normals,
  points,
  tubularSegments,
  uniforms: u,
}) {
  const count = float(u.count);
  const curve = loopSampler(
    storage(points, 'vec4', points.count).toReadOnly(),
    count
  );
  const up = loopSampler(
    storage(normals, 'vec4', normals.count).toReadOnly(),
    count
  );
  const curvature = varyingProperty('float', 'vCurvature');

  const material = createTubeMaterial({
    frameMode,
    material: new THREE.MeshBasicNodeMaterial(),
    radius: ({ progress }) => {
      curvature.assign(curve(progress).w);
      // A surface with holes: where the curve crosses an eye socket or the
      // nasal aperture its points sit on opposite rims and the edge between
      // them spans air, so the tube breaks there instead of bridging.
      const bridge = smoothstep(
        u.dgEdgeLength.mul(2.5),
        u.dgEdgeLength.mul(3.5),
        up(progress).w
      );
      return u.dgTubeRadius
        .mul(float(1).sub(bridge))
        .mul(u.count.greaterThan(3));
    },
    sampleCurve: (t) => curve(t).xyz,
    tubularSegments,
    upAxis: (point, progress) => normalize(up(progress).xyz),
  });

  const n = normalize(varyingProperty('vec3', 'vTubeNormal'));
  const view = normalize(cameraPosition.sub(positionWorld));
  const lightA = vec3(0.65, 0.8, 0.42).normalize();
  const lightB = vec3(-0.42, 0.24, 0.88).normalize();
  const shade = clamp(
    curvature.mul(u.dgCurvatureContrast).add(u.dgCurvatureBias),
    0,
    1
  );
  const base = mix(u.dgGradientStart, u.dgGradientEnd, shade);
  const wrap = 0.32;
  const diffA = max(
    dot(n, lightA)
      .add(wrap)
      .div(1 + wrap),
    0
  );
  const diffB = max(
    dot(n, lightB)
      .add(wrap)
      .div(1 + wrap),
    0
  );
  const specA = pow(max(dot(reflect(lightA.negate(), n), view), 0), 76);
  const specB = pow(max(dot(reflect(lightB.negate(), n), view), 0), 32);
  const fresnel = pow(float(1).sub(max(dot(n, view), 0)), 3);
  const lit = base
    .mul(diffA.mul(0.9).add(diffB.mul(0.5)).mul(0.88).add(0.14))
    .add(vec3(specA.add(specB.mul(0.4)).mul(u.dgSpecular)))
    .add(base.mul(fresnel).mul(u.dgFresnel));
  material.colorNode = vec4(mix(lit, lit.mul(lit).mul(1.25), 0.26), 1);

  return material;
}
