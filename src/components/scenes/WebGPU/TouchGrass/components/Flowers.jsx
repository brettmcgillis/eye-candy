import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import Flower from '@elements/Flower/Flower';
import { hash01 } from '@utils/noise2d';

const FLOWER_MODEL_SCALE = 0.42;

function getTerrainPulse({ config, worldX, worldZ, elapsedTime }) {
  const pulseTime =
    elapsedTime *
    (config.terrainPulseSpeed ?? 0.35) *
    (config.globalMotionSpeed ?? 1);
  const scale = config.terrainPulseScale ?? 0.25;
  const amplitude = config.terrainPulseAmplitude ?? 0;
  const primaryWave = Math.sin(
    worldX * scale * 2.6 + worldZ * scale * 1.6 + pulseTime
  );
  const secondaryWave = Math.sin(
    worldX * scale * 1.15 - worldZ * scale * 2.2 - pulseTime * 1.35
  );

  return (primaryWave * 0.7 + secondaryWave * 0.45) * amplitude;
}

function buildFlowerPlacements({ config, heightField }) {
  const placements = [];
  const half = heightField.worldSize * 0.5;
  const target = Math.max(0, Math.floor(config.flowerCount ?? 0));
  const attempts = target * 8;

  for (let i = 0; i < attempts && placements.length < target; i += 1) {
    const x = (hash01(i, 17, config.seed + 911) * 2 - 1) * half;
    const z = (hash01(i, 29, config.seed + 977) * 2 - 1) * half;
    const carve = heightField.sampleCarve(x, z);

    if (carve >= 0.12) {
      continue;
    }

    const y = heightField.sampleHeight(x, z);
    const scale =
      (config.flowerScale ?? 0.22) *
      FLOWER_MODEL_SCALE *
      (0.7 + hash01(i, 43, config.seed + 1013) * 0.8);
    const yaw = hash01(i, 53, config.seed + 1061) * Math.PI * 2;
    const swayPhase = hash01(i, 61, config.seed + 1091) * Math.PI * 2;
    const swayAmount = 0.05 + hash01(i, 71, config.seed + 1151) * 0.12;

    placements.push({ scale, swayAmount, swayPhase, x, y, yaw, z });
  }

  return placements;
}

function Flowers({ config, heightField }) {
  const flowersRef = useRef(null);
  const placements = useMemo(
    () => buildFlowerPlacements({ config, heightField }),
    [config, heightField]
  );
  const temp = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = flowersRef.current;
    if (!mesh) {
      return;
    }

    mesh.count = placements.length;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;
  }, [placements]);

  useFrame(({ clock }) => {
    const mesh = flowersRef.current;
    if (!mesh) {
      return;
    }

    const elapsedTime = clock.getElapsedTime();
    const windSpeed =
      (config.windSpeed ?? 0.7) * (config.globalMotionSpeed ?? 1);
    const windStrength = config.windStrength ?? 0.35;
    const windDir = new THREE.Vector2(
      config.windDirX ?? 1,
      config.windDirZ ?? 0.35
    );
    if (windDir.lengthSq() < 1e-6) {
      windDir.set(1, 0);
    } else {
      windDir.normalize();
    }

    placements.forEach((placement, index) => {
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

      temp.position.set(
        placement.x,
        placement.y +
          getTerrainPulse({
            config,
            elapsedTime,
            worldX: placement.x,
            worldZ: placement.z,
          }),
        placement.z
      );
      temp.rotation.set(windDir.y * lean, placement.yaw, windDir.x * lean);
      temp.scale.setScalar(placement.scale);
      temp.updateMatrix();
      mesh.setMatrixAt(index, temp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!placements.length) {
    return null;
  }

  return <Flower ref={flowersRef} count={placements.length} />;
}

export default memo(Flowers);
