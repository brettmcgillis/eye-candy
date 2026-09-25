/* eslint-disable camelcase */
import React, { memo, useEffect, useMemo } from 'react';

import {
  color,
  float,
  mix,
  mx_noise_float,
  normalLocal,
  positionLocal,
  smoothstep,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { hash01 } from '@utils/noise2d';

import useStaticCollider from '../hooks/useStaticCollider';

function stumpGeometry(radius, height) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 64, 12);
  const { position } = geometry.attributes;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const y = position.getY(i) + height / 2;
    const r = Math.hypot(x, z);
    if (r > 1e-4) {
      const angle = Math.atan2(z, x);
      const t = y / height;
      const ridges =
        0.03 * Math.sin(angle * 23 + 3 * hash01(Math.round(angle * 9), 0, 5));
      const flare = 0.22 * (1 - Math.min(1, t / 0.25)) ** 2;
      const lobes = flare * (0.6 + 0.4 * Math.sin(angle * 5));
      const k = (1 + ridges + lobes) * (t > 0.999 ? 0.97 : 1);
      position.setX(i, x * k);
      position.setZ(i, z * k);
    }
    position.setY(i, y);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function stumpMaterial(barkColor, woodColor) {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  const p = positionLocal;
  const radial = p.xz.length();
  const angle = p.z.atan(p.x);
  const grain = mx_noise_float(vec3(angle.mul(6), p.y.mul(18), 0.5));
  const bark = color(barkColor).mul(grain.mul(0.35).add(0.75));
  const warp = mx_noise_float(vec3(p.x.mul(4), p.z.mul(4), 1.5)).mul(0.03);
  const rings = radial.add(warp).mul(55).fract();
  const ring = smoothstep(0.35, 0.5, rings).mul(smoothstep(0.65, 0.5, rings));
  const wood = mix(color(woodColor), color(woodColor).mul(0.62), ring);
  const top = smoothstep(0.7, 0.9, normalLocal.y);
  material.colorNode = mix(bark, wood, top).mul(
    float(1).sub(smoothstep(0.25, 0, p.y).mul(0.35))
  );
  return material;
}

function Stump({ barkColor, height, position, radius, woodColor }) {
  const [x, y, z] = position;
  useStaticCollider(
    (RAPIER) =>
      RAPIER.ColliderDesc.cylinder(height / 2, radius).setTranslation(
        x,
        y + height / 2,
        z
      ),
    [height, radius, x, y, z]
  );

  const geometry = useMemo(
    () => stumpGeometry(radius, height),
    [height, radius]
  );
  const material = useMemo(
    () => stumpMaterial(barkColor, woodColor),
    [barkColor, woodColor]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      material={material}
      position={position}
    />
  );
}

export default memo(Stump);
