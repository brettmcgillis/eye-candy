import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import GoldFish from '@elements/GoldFish/GoldFish';

import getTankLayout, { MODEL_SAND_HEIGHT } from '../utils/tankLayout';

const BROKEN_PANE_DIRECTIONS = {
  back: [0, 0, -1],
  front: [0, 0, 1],
  left: [-1, 0, 0],
  right: [1, 0, 0],
};
const MAX_FISH = 2;
const PHASE_OFFSETS = [0, Math.PI];
const STRANDED_LATERAL_OFFSETS = [-0.22, 0.22];
const SURFACE_OFFSET = 0.06;

function getStrandedTarget(index, brokenPaneKey, fish, tank) {
  const lateralOffset = STRANDED_LATERAL_OFFSETS[index] ?? 0;

  if (!brokenPaneKey) {
    return {
      x: lateralOffset,
      y: -tank.height / 2 + MODEL_SAND_HEIGHT + SURFACE_OFFSET,
      z: index === 0 ? -0.16 : 0.16,
    };
  }

  const [dirX, , dirZ] = BROKEN_PANE_DIRECTIONS[brokenPaneKey];
  const y = -tank.height / 2 + SURFACE_OFFSET;

  if (dirZ !== 0) {
    return {
      x: lateralOffset,
      y,
      z: dirZ * (tank.depth / 2 + fish.escapeDistance),
    };
  }

  return {
    x: dirX * (tank.width / 2 + fish.escapeDistance),
    y,
    z: lateralOffset,
  };
}

function getStrandedYaw(brokenPaneKey) {
  switch (brokenPaneKey) {
    case 'back':
      return Math.PI;
    case 'left':
      return -Math.PI / 2;
    case 'right':
      return Math.PI / 2;
    case 'front':
    default:
      return 0;
  }
}

export default function FishSystem({
  fish,
  runtime,
  tank,
  showMarkers = false,
}) {
  const fishRefs = useRef([]);
  const refCallbacks = useMemo(
    () =>
      Array.from({ length: MAX_FISH }, (_, index) => (node) => {
        fishRefs.current[index] = node;
      }),
    []
  );

  useFrame((state) => {
    if (!fish.visible) {
      return;
    }

    const elapsed = state.clock.elapsedTime * fish.speed;
    const waterLevel = runtime ? runtime.getWaterLevel() : tank.waterLevel;
    const brokenPaneKey = runtime ? runtime.getFirstBrokenPane() : null;
    const { innerDepth, innerWidth, maxFishY, minFishY, waterHeight } =
      getTankLayout({ ...tank, waterLevel });
    const radiusX = Math.min(fish.radiusX, innerWidth * 0.42);
    const radiusZ = Math.min(fish.radiusZ, innerDepth * 0.42);
    const swimBaseY =
      minFishY + Math.max(0.05, waterHeight * 0.45) + fish.baseYOffset;
    const shouldStrand = waterLevel <= fish.strandLevel;

    for (let index = 0; index < fish.count; index += 1) {
      const fishNode = fishRefs.current[index];

      if (fishNode) {
        const phase = PHASE_OFFSETS[index] ?? 0;
        const angle = elapsed + phase;

        if (shouldStrand) {
          const flopPhase = state.clock.elapsedTime * 7 + phase;
          const strandedTarget = getStrandedTarget(
            index,
            brokenPaneKey,
            fish,
            tank
          );

          fishNode.position.set(
            strandedTarget.x,
            strandedTarget.y,
            strandedTarget.z
          );
          fishNode.rotation.y = getStrandedYaw(brokenPaneKey);
          fishNode.rotation.x = Math.sin(flopPhase) * fish.flopAmplitude;
          fishNode.rotation.z =
            Math.cos(flopPhase * 0.72) * fish.flopAmplitude * 0.35;
        } else {
          const x = Math.cos(angle) * radiusX;
          const z = Math.sin(angle) * radiusZ;
          const y = Math.min(
            maxFishY,
            Math.max(
              minFishY,
              swimBaseY + Math.sin(angle * 2.1) * fish.bobAmplitude
            )
          );

          fishNode.position.set(x, y, z);
          fishNode.rotation.x = 0;
          fishNode.rotation.y = -angle + Math.PI / 2;
          fishNode.rotation.z = Math.sin(angle * 2.8) * 0.08;
        }
      }
    }
  });

  return Array.from({ length: fish.count }, (_, index) => (
    <group
      key={`fish-${index}`}
      ref={refCallbacks[index]}
      visible={fish.visible}
    >
      <GoldFish scale={fish.scale} />
      {showMarkers && (
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[fish.markerSize, 12, 12]} />
          <meshBasicMaterial color={fish.markerColor} />
        </mesh>
      )}
    </group>
  ));
}
