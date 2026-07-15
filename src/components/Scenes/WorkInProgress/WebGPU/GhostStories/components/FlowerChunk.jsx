import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { hash01 } from '../../../../../../utils/noise2d';
import Flower from '../../../../../elements/Flower/Flower';
import { CHUNK_SIZE } from '../utils/worldgen';

const FLOWER_MODEL_SCALE = 0.42;

// Sparse wildflowers per chunk: deterministic scatter off the same worldgen
// samplers as the grass, wind sway on the CPU (counts are tiny), and a
// ghost-proximity lean so flowers bow out of the ghost's way like the
// blades do.
function buildPlacements({ config, cx, cz, world }) {
  const placements = [];
  const centerX = cx * CHUNK_SIZE;
  const centerZ = cz * CHUNK_SIZE;
  const half = CHUNK_SIZE * 0.5;
  const target = Math.max(0, Math.floor(config.flowersPerChunk));
  const attempts = target * 8;
  const chunkSeed = world.seed + cx * 7349 + cz * 15733;

  for (let i = 0; i < attempts && placements.length < target; i += 1) {
    const x = centerX + (hash01(i, 17, chunkSeed + 911) * 2 - 1) * half;
    const z = centerZ + (hash01(i, 29, chunkSeed + 977) * 2 - 1) * half;

    if (world.samplePath(x, z) > 0.25) {
      continue; // eslint-disable-line no-continue
    }
    const y = world.sampleHeight(x, z);
    if (y < world.waterLevel + 0.1) {
      continue; // eslint-disable-line no-continue
    }

    const scale =
      config.flowerScale *
      FLOWER_MODEL_SCALE *
      (0.7 + hash01(i, 43, chunkSeed + 1013) * 0.8);
    const yaw = hash01(i, 53, chunkSeed + 1061) * Math.PI * 2;
    const swayPhase = hash01(i, 61, chunkSeed + 1091) * Math.PI * 2;
    const swayAmount = 0.05 + hash01(i, 71, chunkSeed + 1151) * 0.12;

    placements.push({ scale, swayAmount, swayPhase, x, y, yaw, z });
  }

  return placements;
}

function FlowerChunk({ config, cx, cz, tracker, world }) {
  const meshRef = useRef(null);
  const placements = useMemo(
    () => buildPlacements({ config, cx, cz, world }),
    [config.flowersPerChunk, config.flowerScale, cx, cz, world]
  );
  const temp = useMemo(() => new THREE.Object3D(), []);
  const windDir = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.count = placements.length;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;
  }, [placements]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsedTime = clock.getElapsedTime();
    const { windSpeed, windStrength, touchRadius, touchStrength } = config;
    windDir.set(config.windDirX, config.windDirZ);
    if (windDir.lengthSq() < 1e-6) {
      windDir.set(1, 0);
    } else {
      windDir.normalize();
    }
    const ghost = tracker?.position;

    for (let index = 0; index < placements.length; index += 1) {
      const placement = placements[index];
      const swayWave =
        Math.sin(elapsedTime * (0.8 + windSpeed * 1.6) + placement.swayPhase) *
          0.65 +
        Math.sin(
          elapsedTime * (1.9 + windSpeed * 2.2) +
            placement.swayPhase * 1.7 +
            (placement.x * 0.2 + placement.z * 0.16)
        ) *
          0.35;
      const lean = placement.swayAmount * windStrength * swayWave;

      let ghostLeanX = 0;
      let ghostLeanZ = 0;
      if (ghost) {
        const dx = placement.x - ghost.x;
        const dz = placement.z - ghost.z;
        const dist = Math.hypot(dx, dz);
        if (dist < touchRadius && dist > 1e-4) {
          const falloff = (1 - dist / touchRadius) ** 2;
          const strength = falloff * touchStrength * 0.6;
          ghostLeanX = (dx / dist) * strength;
          ghostLeanZ = (dz / dist) * strength;
        }
      }

      temp.position.set(placement.x, placement.y, placement.z);
      temp.rotation.set(
        windDir.y * lean + ghostLeanZ,
        placement.yaw,
        windDir.x * lean - ghostLeanX
      );
      temp.scale.setScalar(placement.scale);
      temp.updateMatrix();
      mesh.setMatrixAt(index, temp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!placements.length) {
    return null;
  }

  return <Flower ref={meshRef} count={placements.length} />;
}

export default memo(FlowerChunk);
