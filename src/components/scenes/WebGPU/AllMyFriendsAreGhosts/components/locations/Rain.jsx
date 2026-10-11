import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { RAIN_BOX, createRainMaterial } from '../../utils/materials';

const STREAK_WIDTH = 0.012;

// Streaks lie along fall + airspeed so they rake past the wing at flight angle.
function buildGeometry(count, length, velocity) {
  const axis = velocity.clone().normalize();
  const side = new THREE.Vector3(1, 0, 0);
  if (Math.abs(axis.dot(side)) > 0.9) side.set(0, 0, 1);
  const across = side.clone().cross(axis).normalize();
  const across2 = across.clone().cross(axis).normalize();
  const half = axis.clone().multiplyScalar(length / 2);

  const positions = new Float32Array(count * 8 * 3);
  const offsets = new Float32Array(count * 8 * 4);
  const indices = new Uint32Array(count * 12);
  const corner = new THREE.Vector3();

  for (let drop = 0; drop < count; drop += 1) {
    const ox = Math.random() * RAIN_BOX;
    const oy = Math.random() * RAIN_BOX;
    const oz = Math.random() * RAIN_BOX;
    const seed = Math.random();
    [across, across2].forEach((dir, quad) => {
      for (let v = 0; v < 4; v += 1) {
        const index = drop * 8 + quad * 4 + v;
        corner
          .copy(dir)
          .multiplyScalar((v % 2 === 0 ? -1 : 1) * STREAK_WIDTH)
          .addScaledVector(half, v < 2 ? -1 : 1);
        positions.set([corner.x, corner.y, corner.z], index * 3);
        offsets.set([ox, oy, oz, seed], index * 4);
      }
      const base = drop * 8 + quad * 4;
      indices.set(
        [base, base + 1, base + 2, base + 2, base + 1, base + 3],
        drop * 12 + quad * 6
      );
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('dropOffset', new THREE.BufferAttribute(offsets, 4));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

function Rain({ airspeed, color, count, fall, flashRef, length, opacity }) {
  const velocity = useMemo(
    () => new THREE.Vector3(0, -fall, -airspeed),
    [airspeed, fall]
  );
  const geometry = useMemo(
    () => buildGeometry(count, length, velocity),
    [count, length, velocity]
  );
  const { material, uniforms } = useMemo(() => createRainMaterial(), []);

  useEffect(() => {
    uniforms.color.value.set(color);
    uniforms.opacity.value = opacity;
    uniforms.velocity.value.copy(velocity);
  }, [color, opacity, uniforms, velocity]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    uniforms.phase.value = (uniforms.phase.value + delta) % 1000;
    uniforms.flash.value = flashRef.current;
  });

  return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}

export default memo(Rain);
