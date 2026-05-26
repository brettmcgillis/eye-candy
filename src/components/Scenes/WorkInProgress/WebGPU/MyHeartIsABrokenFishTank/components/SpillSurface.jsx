import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { FISH_TANK_PANE_KEYS } from '../../../../../elements/fishTank/FishTank';
import { getTableLayout } from '../utils/sceneLayout';

const DEPTH_DAMPING = 0.996;
const DEPTH_SPREAD = 0.18;
const DOMAIN_RESOLUTION = 36;
const RIPPLE_DAMPING = 0.985;
const SOURCE_STRIP_PADDING = 0.12;
const SOURCE_STRIP_THICKNESS = 0.28;

const sharedPlane = new THREE.Plane();
const sharedPlaneNormal = new THREE.Vector3();
const sharedPlaneOrigin = new THREE.Vector3();
const sharedPointerIntersection = new THREE.Vector3();
const sharedPointerLocal = new THREE.Vector3();
const sharedQuaternion = new THREE.Quaternion();
const sharedRaycaster = new THREE.Raycaster();
const sharedCouplerLocalPoint = new THREE.Vector3();
const sharedCouplerWorldPoint = new THREE.Vector3();

function clampIndex(value, max) {
  return Math.max(0, Math.min(max, value));
}

function applyWaveImpulse(buffer, field, localX, localZ, amplitude) {
  const waveBuffer = buffer;
  const cellX = clampIndex(
    Math.round(
      ((localX + field.domainWidth / 2) / field.domainWidth) *
        (field.resolution - 1)
    ),
    field.resolution - 1
  );
  const cellZ = clampIndex(
    Math.round(
      ((localZ + field.domainDepth / 2) / field.domainDepth) *
        (field.resolution - 1)
    ),
    field.resolution - 1
  );

  for (let dz = -2; dz <= 2; dz += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const x = cellX + dx;
      const z = cellZ + dz;

      if (x >= 0 && x < field.resolution && z >= 0 && z < field.resolution) {
        const index = z * field.resolution + x;
        const weight = Math.exp(-(dx * dx + dz * dz) * 0.65);

        waveBuffer[index] += amplitude * weight;
      }
    }
  }
}

function applyDepthImpulse(buffer, field, localX, localZ, amplitude) {
  const depthBuffer = buffer;
  const cellX = clampIndex(
    Math.round(
      ((localX + field.domainWidth / 2) / field.domainWidth) *
        (field.resolution - 1)
    ),
    field.resolution - 1
  );
  const cellZ = clampIndex(
    Math.round(
      ((localZ + field.domainDepth / 2) / field.domainDepth) *
        (field.resolution - 1)
    ),
    field.resolution - 1
  );

  for (let dz = -2; dz <= 2; dz += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const x = cellX + dx;
      const z = cellZ + dz;

      if (x >= 0 && x < field.resolution && z >= 0 && z < field.resolution) {
        const index = z * field.resolution + x;
        const weight = Math.exp(-(dx * dx + dz * dz) * 0.58);

        depthBuffer[index] = Math.min(
          field.maxDepth,
          depthBuffer[index] + amplitude * weight
        );
      }
    }
  }
}

function buildSourceIndices({ resolution, tank, xCoords, zCoords }) {
  const halfDepth = tank.depth / 2;
  const halfWidth = tank.width / 2;
  const sideSpanZ = tank.depth * 0.42;
  const sideSpanX = tank.width * 0.42;
  const stripPadding = Math.max(SOURCE_STRIP_PADDING, tank.spillThickness * 4);
  const stripThickness = Math.max(
    SOURCE_STRIP_THICKNESS,
    tank.spillThickness * 6
  );
  const sources = {
    back: [],
    front: [],
    left: [],
    right: [],
  };

  for (let index = 0; index < resolution * resolution; index += 1) {
    const x = xCoords[index];
    const z = zCoords[index];

    if (
      Math.abs(x) <= sideSpanX &&
      z >= halfDepth - stripPadding &&
      z <= halfDepth + stripThickness
    ) {
      sources.front.push(index);
    }

    if (
      Math.abs(x) <= sideSpanX &&
      z <= -halfDepth + stripPadding &&
      z >= -halfDepth - stripThickness
    ) {
      sources.back.push(index);
    }

    if (
      Math.abs(z) <= sideSpanZ &&
      x >= halfWidth - stripPadding &&
      x <= halfWidth + stripThickness
    ) {
      sources.right.push(index);
    }

    if (
      Math.abs(z) <= sideSpanZ &&
      x <= -halfWidth + stripPadding &&
      x >= -halfWidth - stripThickness
    ) {
      sources.left.push(index);
    }
  }

  return sources;
}

function createFluidField(tank, tableConfig) {
  const table = getTableLayout(tank, tableConfig);
  const domainWidth = table.width;
  const domainDepth = table.depth;
  const resolution = DOMAIN_RESOLUTION;
  const geometry = new THREE.PlaneGeometry(
    domainWidth,
    domainDepth,
    resolution - 1,
    resolution - 1
  );

  geometry.rotateX(-Math.PI / 2);

  const positionAttr = geometry.getAttribute('position');
  const basePositions = Float32Array.from(positionAttr.array);
  const edgeDrain = new Float32Array(resolution * resolution);
  const blockedHalfDepth = Math.max(0, tank.depth / 2 - tank.glassThickness);
  const blockedHalfWidth = Math.max(0, tank.width / 2 - tank.glassThickness);
  const tankBaseMask = new Uint8Array(resolution * resolution);
  const xCoords = new Float32Array(resolution * resolution);
  const zCoords = new Float32Array(resolution * resolution);

  for (let index = 0; index < resolution * resolution; index += 1) {
    xCoords[index] = basePositions[index * 3];
    zCoords[index] = basePositions[index * 3 + 2];

    const x = xCoords[index];
    const z = zCoords[index];
    const edgeDistance = Math.min(
      domainWidth / 2 - Math.abs(x),
      domainDepth / 2 - Math.abs(z)
    );

    edgeDrain[index] = THREE.MathUtils.clamp(
      1 - edgeDistance / table.edgeBand,
      0,
      1
    );
    tankBaseMask[index] =
      Math.abs(x) < blockedHalfWidth && Math.abs(z) < blockedHalfDepth ? 1 : 0;
  }

  return {
    basePositions,
    blockedHalfDepth,
    blockedHalfWidth,
    depthCurrent: new Float32Array(resolution * resolution),
    depthNext: new Float32Array(resolution * resolution),
    domainDepth,
    domainWidth,
    edgeDrain,
    geometry,
    maxDepth: Math.max(tank.spillThickness * 1.8, 0.03),
    positionAttr,
    resolution,
    sourceIndicesByPane: buildSourceIndices({
      resolution,
      tank,
      xCoords,
      zCoords,
    }),
    vertexCount: resolution * resolution,
    waveCurrent: new Float32Array(resolution * resolution),
    waveNext: new Float32Array(resolution * resolution),
    wavePrev: new Float32Array(resolution * resolution),
    xCoords,
    zCoords,
    tankBaseMask,
  };
}

function resetFluidField(field) {
  field.depthCurrent.fill(0);
  field.depthNext.fill(0);
  field.waveCurrent.fill(0);
  field.waveNext.fill(0);
  field.wavePrev.fill(0);
}

export default function SpillSurface({
  fluidCouplersRef,
  runtime,
  table,
  tank,
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const couplerPreviousPositionsRef = useRef(new WeakMap());
  const lastResetNonceRef = useRef(runtime?.getResetNonce?.() ?? 0);
  const pointer = useThree((state) => state.pointer);
  const meshRef = useRef(null);
  const lastPointerLocalRef = useRef(null);
  const supportsSplash =
    gl?.backend?.isWebGPUBackend === true &&
    Boolean(gl?.backend?.device) &&
    Boolean(gl?.backend?.context) &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.gpu);
  const field = useMemo(
    () => createFluidField(tank, table),
    [
      table.depth,
      table.position,
      table.thickness,
      table.width,
      tank.depth,
      tank.glassThickness,
      tank.height,
      tank.spillExtent,
      tank.spillThickness,
      tank.width,
    ]
  );
  const tableLayout = getTableLayout(tank, table);

  useFrame((_, delta) => {
    if (supportsSplash) {
      return;
    }

    const resetNonce = runtime?.getResetNonce?.() ?? 0;

    if (resetNonce !== lastResetNonceRef.current) {
      lastResetNonceRef.current = resetNonce;
      resetFluidField(field);
      lastPointerLocalRef.current = null;

      if (meshRef.current) {
        meshRef.current.visible = false;
      }
    }

    const activeWaterLevel = runtime
      ? runtime.getWaterLevel()
      : tank.waterLevel;
    const brokenPaneCount = runtime ? runtime.getBrokenPaneCount() : 0;
    const deltaScale = Math.min(delta * 60, 2);
    const drainProgress =
      tank.waterLevel > 0 ? 1 - activeWaterLevel / tank.waterLevel : 0;
    const evaporation = Math.max(0, 1 - delta * 0.02);

    for (let z = 0; z < field.resolution; z += 1) {
      for (let x = 0; x < field.resolution; x += 1) {
        const index = z * field.resolution + x;

        if (field.tankBaseMask[index]) {
          field.depthNext[index] = 0;
          field.waveNext[index] = 0;
        } else if (
          x === 0 ||
          z === 0 ||
          x === field.resolution - 1 ||
          z === field.resolution - 1
        ) {
          field.depthNext[index] = field.depthCurrent[index] * 0.9;
          field.waveNext[index] = 0;
        } else {
          const left = index - 1;
          const right = index + 1;
          const up = index - field.resolution;
          const down = index + field.resolution;
          const avgDepth =
            (field.depthCurrent[left] +
              field.depthCurrent[right] +
              field.depthCurrent[up] +
              field.depthCurrent[down]) /
            4;
          const edgeDrain = field.edgeDrain[index];
          const edgeDrainFactor = Math.max(
            0,
            1 - edgeDrain * 0.18 * deltaScale
          );

          field.depthNext[index] = THREE.MathUtils.clamp(
            (field.depthCurrent[index] +
              (avgDepth - field.depthCurrent[index]) *
                DEPTH_SPREAD *
                deltaScale) *
              DEPTH_DAMPING *
              evaporation *
              edgeDrainFactor,
            0,
            field.maxDepth
          );

          field.waveNext[index] =
            ((field.waveCurrent[left] +
              field.waveCurrent[right] +
              field.waveCurrent[up] +
              field.waveCurrent[down]) *
              0.5 -
              field.wavePrev[index]) *
            RIPPLE_DAMPING *
            Math.max(0.45, 1 - edgeDrain * 0.22);
        }
      }
    }

    if (brokenPaneCount && activeWaterLevel > 0) {
      const sourceRate =
        activeWaterLevel * tank.spillThickness * 0.18 * deltaScale;
      const sourceWave = sourceRate * 0.7 + drainProgress * 0.0025;

      FISH_TANK_PANE_KEYS.forEach((paneKey) => {
        if (!runtime?.isPaneBroken(paneKey)) {
          return;
        }

        field.sourceIndicesByPane[paneKey].forEach((index) => {
          if (field.tankBaseMask[index]) {
            return;
          }

          field.depthNext[index] = Math.min(
            field.maxDepth,
            field.depthNext[index] + sourceRate
          );
          field.waveNext[index] += sourceWave;
        });
      });
    }

    if (meshRef.current && (brokenPaneCount || drainProgress > 0.01)) {
      meshRef.current.getWorldQuaternion(sharedQuaternion);
      sharedPlaneNormal
        .set(0, 1, 0)
        .applyQuaternion(sharedQuaternion)
        .normalize();
      meshRef.current.getWorldPosition(sharedPlaneOrigin);
      sharedRaycaster.setFromCamera(pointer, camera);

      if (
        sharedRaycaster.ray.intersectPlane(
          sharedPlane.setFromNormalAndCoplanarPoint(
            sharedPlaneNormal,
            sharedPlaneOrigin
          ),
          sharedPointerIntersection
        )
      ) {
        sharedPointerLocal.copy(sharedPointerIntersection);
        meshRef.current.worldToLocal(sharedPointerLocal);

        if (
          Math.abs(sharedPointerLocal.x) <= field.domainWidth / 2 &&
          Math.abs(sharedPointerLocal.z) <= field.domainDepth / 2 &&
          !(
            Math.abs(sharedPointerLocal.x) < field.blockedHalfWidth &&
            Math.abs(sharedPointerLocal.z) < field.blockedHalfDepth
          )
        ) {
          const lastPointerLocal = lastPointerLocalRef.current;

          if (lastPointerLocal) {
            const pointerTravel =
              lastPointerLocal.distanceTo(sharedPointerLocal);
            const pointerImpulse = Math.min(
              tank.spillThickness * 0.8,
              pointerTravel * tank.waterDisturbance * 3.2
            );

            if (pointerImpulse > 0.0005) {
              applyWaveImpulse(
                field.waveNext,
                field,
                sharedPointerLocal.x,
                sharedPointerLocal.z,
                pointerImpulse
              );
            }
          }

          lastPointerLocalRef.current = sharedPointerLocal.clone();
        } else {
          lastPointerLocalRef.current = null;
        }
      } else {
        lastPointerLocalRef.current = null;
      }
    } else {
      lastPointerLocalRef.current = null;
    }

    if (meshRef.current) {
      const previousPositions = couplerPreviousPositionsRef.current;

      (fluidCouplersRef?.current ?? []).forEach((node) => {
        if (!node) {
          return;
        }

        node.getWorldPosition(sharedCouplerWorldPoint);

        const previousWorldPoint = previousPositions.get(node);

        if (!previousWorldPoint) {
          previousPositions.set(node, sharedCouplerWorldPoint.clone());
          return;
        }

        sharedCouplerLocalPoint.copy(sharedCouplerWorldPoint);
        meshRef.current.worldToLocal(sharedCouplerLocalPoint);

        if (
          Math.abs(sharedCouplerLocalPoint.x) <= field.domainWidth / 2 &&
          Math.abs(sharedCouplerLocalPoint.z) <= field.domainDepth / 2 &&
          Math.abs(sharedCouplerLocalPoint.y) <= 0.28 &&
          !(
            Math.abs(sharedCouplerLocalPoint.x) < field.blockedHalfWidth &&
            Math.abs(sharedCouplerLocalPoint.z) < field.blockedHalfDepth
          )
        ) {
          const speed =
            sharedCouplerWorldPoint.distanceTo(previousWorldPoint) /
            Math.max(delta, 1 / 120);
          const waveImpulse = Math.min(field.maxDepth * 0.85, speed * 0.00065);
          const depthImpulse = Math.min(field.maxDepth * 0.14, speed * 0.00008);

          if (waveImpulse > 0.0004) {
            applyWaveImpulse(
              field.waveNext,
              field,
              sharedCouplerLocalPoint.x,
              sharedCouplerLocalPoint.z,
              waveImpulse
            );
          }

          if (depthImpulse > 0.00015) {
            applyDepthImpulse(
              field.depthNext,
              field,
              sharedCouplerLocalPoint.x,
              sharedCouplerLocalPoint.z,
              depthImpulse
            );
          }
        }

        previousWorldPoint.copy(sharedCouplerWorldPoint);
      });
    }

    [field.depthCurrent, field.depthNext] = [
      field.depthNext,
      field.depthCurrent,
    ];
    [field.wavePrev, field.waveCurrent, field.waveNext] = [
      field.waveCurrent,
      field.waveNext,
      field.wavePrev,
    ];

    const positions = field.positionAttr.array;
    let maxVisibleDepth = 0;

    for (let index = 0; index < field.vertexCount; index += 1) {
      const depth = field.depthCurrent[index];
      const wave =
        field.waveCurrent[index] *
        Math.min(1, depth / Math.max(field.maxDepth, 0.0001));

      positions[index * 3 + 1] =
        field.basePositions[index * 3 + 1] +
        (field.tankBaseMask[index] ? 0 : depth + wave);
      maxVisibleDepth = Math.max(maxVisibleDepth, depth + Math.max(wave, 0));
    }

    field.positionAttr.needsUpdate = true;
    field.geometry.computeVertexNormals();

    if (meshRef.current) {
      meshRef.current.visible = maxVisibleDepth > 0.0008;
    }
  });

  if (supportsSplash) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      geometry={field.geometry}
      position={[
        table.position[0],
        tableLayout.topY + 0.002,
        table.position[2],
      ]}
      receiveShadow
      visible={false}
    >
      <meshPhysicalMaterial
        clearcoat={0.45}
        color={tank.waterColor}
        opacity={tank.spillOpacity}
        roughness={0.08}
        side={THREE.DoubleSide}
        thickness={0.35}
        transmission={0.18}
        transparent
      />
    </mesh>
  );
}
