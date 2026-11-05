/* eslint-disable no-param-reassign */
import {
  Fn,
  attribute,
  cos,
  float,
  normalGeometry,
  positionGeometry,
  select,
  sin,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { HISTORY_MAX_CIRCLES, historyPackingFor } from '@modules/apollonian';

export function historyMeshNodes(u) {
  const circle = attribute('historyCircle', 'vec4');
  const pointAt = Fn(([source, y, radial]) => {
    const seconds = u.historyTime
      .sub(float(0.5).sub(y.div(u.historyHeight)).mul(u.historySeconds))
      .toVar();
    const magnitude = u.historyWarp.mul(
      sin(seconds.mul(0.43)).mul(0.35).add(0.65)
    );
    const a = vec2(cos(seconds.mul(0.27)), sin(seconds.mul(0.27)))
      .mul(magnitude)
      .toVar();
    const r = source.z.mul(u.historyGap.oneMinus());
    const den = vec2(
      float(1).add(a.dot(source.xy)),
      a.x.mul(source.y).sub(a.y.mul(source.x))
    );
    const a2 = a.dot(a);
    const divisor = den
      .dot(den)
      .sub(a2.mul(r.mul(r)))
      .toVar();
    const sum = source.xy.add(a);
    const centre = vec2(sum.dot(den), sum.y.mul(den.x).sub(sum.x.mul(den.y)))
      .sub(a.mul(r.mul(r)))
      .div(divisor);
    const angle = seconds.mul(u.historyTwist);
    const rotated = vec2(
      cos(angle).mul(centre.x).sub(sin(angle).mul(centre.y)),
      sin(angle).mul(centre.x).add(cos(angle).mul(centre.y))
    );
    const xz = rotated.add(radial.mul(r.mul(a2.oneMinus()).div(divisor)));
    return vec3(xz.x, y, xz.y);
  }).setLayout({
    name: 'historyMeshPoint',
    type: 'vec3',
    inputs: [
      { name: 'source', type: 'vec4' },
      { name: 'y', type: 'float' },
      { name: 'radial', type: 'vec2' },
    ],
  });
  const y = positionGeometry.y.mul(u.historyHeight);
  const radial = positionGeometry.xz;
  const local = pointAt(circle, y, radial);
  const slope = pointAt(circle, y.add(0.001), radial)
    .sub(pointAt(circle, y.sub(0.001), radial))
    .div(0.002);
  const sideNormal = vec3(
    radial.x,
    slope.x.mul(radial.x).add(slope.z.mul(radial.y)).negate(),
    radial.y
  ).normalize();
  const normal = select(
    normalGeometry.y.abs().greaterThan(0.5),
    normalGeometry,
    sideNormal
  );
  return {
    trap: circle.w.toVarying('historyTrap'),
    depth: float(1)
      .div(circle.z)
      .log2()
      .div(7)
      .clamp(0, 1)
      .toVarying('historyDepth'),
    normal: u.toWorld.mul(normal).toVarying('historyNormal').normalize(),
    position: u.toWorld.mul(local).mul(u.objectSize),
  };
}

export default function createHistoryMeshes() {
  const group = new THREE.Group();
  const buckets = [16, 32, 64].map((segments) => {
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, segments, 96);
    const geometry = new THREE.InstancedBufferGeometry().copy(cylinder);
    cylinder.dispose();
    geometry.setAttribute(
      'historyCircle',
      new THREE.InstancedBufferAttribute(
        new Float32Array(HISTORY_MAX_CIRCLES * 4),
        4
      )
    );
    geometry.instanceCount = 0;
    const mesh = new THREE.Mesh(geometry, null);
    mesh.frustumCulled = false;
    mesh.userData.plot = false;
    group.add(mesh);
    return mesh;
  });
  let packing = null;
  let currentMaterial = null;
  return {
    group,
    apply(config, material) {
      const next = historyPackingFor(config).circles;
      if (next !== packing) {
        const counts = [0, 0, 0];
        for (let o = 0; o < next.length; o += 4) {
          let bucket = 0;
          if (next[o + 2] > 0.06) bucket = 1;
          if (next[o + 2] > 0.2) bucket = 2;
          const attr = buckets[bucket].geometry.attributes.historyCircle;
          attr.array.set(next.subarray(o, o + 4), counts[bucket] * 4);
          counts[bucket] += 1;
        }
        buckets.forEach((mesh, i) => {
          mesh.geometry.instanceCount = counts[i];
          mesh.geometry.attributes.historyCircle.needsUpdate = true;
        });
        packing = next;
      }
      if (material !== currentMaterial) {
        buckets.forEach((mesh) => {
          mesh.material = material;
        });
        currentMaterial = material;
      }
    },
    dispose() {
      buckets.forEach((mesh) => mesh.geometry.dispose());
    },
  };
}
