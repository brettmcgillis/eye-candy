import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { fbm2 } from '../../../../../../utils/noise2d';

const RADIAL_SEGMENTS = 256;

// Unreachable mountain range on the horizon: a jagged silhouette ring that
// follows the ghost continuously (so it never gets closer), sitting inside
// the fog's long-range haze. Geometry is a triangle band from a sunken base
// ring up to a noise-driven skyline.
function buildRingGeometry({ height, radius, seed }) {
  const positions = new Float32Array(RADIAL_SEGMENTS * 2 * 3);
  const indices = new Uint16Array(RADIAL_SEGMENTS * 6);

  for (let i = 0; i < RADIAL_SEGMENTS; i += 1) {
    const angle = (i / RADIAL_SEGMENTS) * Math.PI * 2;
    // Multi-octave skyline, periodic by construction (noise sampled on the
    // ring's circle in a 2D domain, so segment 0 meets the last one).
    const nx = Math.cos(angle) * 2.3;
    const nz = Math.sin(angle) * 2.3;
    const ridge = fbm2(nx, nz, { seed, octaves: 4 });
    const jag = fbm2(nx * 4.1, nz * 4.1, { seed: seed + 5, octaves: 2 });
    const peak = height * (0.35 + ridge * 0.65) * (0.75 + jag * 0.5);
    const r = radius * (0.92 + ridge * 0.16);

    const base = i * 2;
    positions[base * 3] = Math.cos(angle) * r;
    positions[base * 3 + 1] = -8;
    positions[base * 3 + 2] = Math.sin(angle) * r;
    positions[(base + 1) * 3] = Math.cos(angle) * r;
    positions[(base + 1) * 3 + 1] = peak;
    positions[(base + 1) * 3 + 2] = Math.sin(angle) * r;

    const next = ((i + 1) % RADIAL_SEGMENTS) * 2;
    indices[i * 6] = base;
    indices[i * 6 + 1] = base + 1;
    indices[i * 6 + 2] = next;
    indices[i * 6 + 3] = next;
    indices[i * 6 + 4] = base + 1;
    indices[i * 6 + 5] = next + 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(),
    radius + height
  );
  return geometry;
}

function Mountains({ config, tracker, world }) {
  const groupRef = useRef(null);

  const geometry = useMemo(
    () =>
      buildRingGeometry({
        height: config.mountainHeight,
        radius: config.mountainRadius,
        seed: world.seed + 909,
      }),
    [config.mountainHeight, config.mountainRadius, world.seed]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.set(tracker.position.x, 0, tracker.position.z);
  });

  if (!config.mountainsEnabled) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={config.mountainColor}
          metalness={0}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default memo(Mountains);
