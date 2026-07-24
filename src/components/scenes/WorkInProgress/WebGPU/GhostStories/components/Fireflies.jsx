import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { hash01 } from '../../../../../../utils/noise2d';
import { CHUNK_SIZE } from '../utils/worldgen';

// Emissive firefly motes wandering low over the meadow around the ghost.
// A single points cloud spans the loaded area; each firefly is seeded from
// its home chunk so a revisited field lights up the same way. Motion is a
// cheap CPU wander (a few hundred points) with a per-firefly blink phase
// baked into vertex alpha via color attribute intensity.
function Fireflies({ center, config, world }) {
  const pointsRef = useRef(null);
  const count = Math.max(1, Math.floor(config.fireflyCount));

  const { basePositions, phases, positions } = useMemo(() => {
    const span = CHUNK_SIZE * (config.grassChunkRadius * 2 + 1);
    const half = span / 2;
    const centerX = center.cx * CHUNK_SIZE;
    const centerZ = center.cz * CHUNK_SIZE;
    const seed = world.seed + 4241;

    const base = new Float32Array(count * 3);
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count * 2);

    for (let i = 0; i < count; i += 1) {
      const x = centerX + (hash01(i, 3, seed) * 2 - 1) * half;
      const z = centerZ + (hash01(i, 7, seed) * 2 - 1) * half;
      const ground = world.sampleHeight(x, z);
      // Fireflies gather low, favoring hollows and shorelines.
      const y =
        Math.max(ground, world.waterLevel) + 0.25 + hash01(i, 11, seed) * 1.4;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      phase[i * 2] = hash01(i, 13, seed) * Math.PI * 2;
      phase[i * 2 + 1] = 0.5 + hash01(i, 17, seed);
    }

    return { basePositions: base, phases: phase, positions: pos };
  }, [center.cx, center.cz, config.grassChunkRadius, count, world]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10000);
    return geo;
  }, [positions]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const color = useMemo(
    () =>
      new THREE.Color(config.fireflyColor).multiplyScalar(
        config.fireflyIntensity
      ),
    [config.fireflyColor, config.fireflyIntensity]
  );

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    const elapsed = clock.getElapsedTime() * config.fireflySpeed;
    const attr = points.geometry.attributes.position;
    const arr = attr.array;

    for (let i = 0; i < count; i += 1) {
      const phase = phases[i * 2];
      const rate = phases[i * 2 + 1];
      arr[i * 3] =
        basePositions[i * 3] + Math.sin(elapsed * rate + phase) * 0.9;
      arr[i * 3 + 1] =
        basePositions[i * 3 + 1] +
        Math.sin(elapsed * rate * 1.7 + phase * 2.1) * 0.35;
      arr[i * 3 + 2] =
        basePositions[i * 3 + 2] +
        Math.cos(elapsed * rate * 0.8 + phase * 1.3) * 0.9;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        blending={THREE.AdditiveBlending}
        color={color}
        depthWrite={false}
        size={config.fireflySize}
        sizeAttenuation
        toneMapped={false}
        transparent
      />
    </points>
  );
}

export default memo(Fireflies);
