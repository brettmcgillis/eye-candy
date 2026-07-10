import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  SHOT_ASSET_OPTIONS,
  SHOT_POOL_SLOTS_PER_ASSET,
} from '../utils/sceneData';

const MIN_SPEED = 3.5;
const LENGTH_PER_SPEED = 0.06;
const MIN_LENGTH = 0.25;
const MAX_LENGTH = 2.2;
const WIDTH = 0.16;
const STREAK_COLOR = '#aab0b6';
const STREAK_OPACITY = 0.6;

const HIDDEN_POSITION = new THREE.Vector3(0, -9999, 0);

const workMatrix = new THREE.Matrix4();
const workPosition = new THREE.Vector3();
const workVelocity = new THREE.Vector3();
const workDirection = new THREE.Vector3();
const workToCamera = new THREE.Vector3();
const workSide = new THREE.Vector3();
const workNormal = new THREE.Vector3();
const hiddenMatrix = new THREE.Matrix4()
  .makeScale(0, 0, 0)
  .setPosition(HIDDEN_POSITION);

function createStreakTexture() {
  const width = 64;
  const height = 16;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      // Bright toward the head (u = 1), feathered across the width.
      const lengthAlpha = u ** 1.5;
      const widthAlpha = Math.cos((v - 0.5) * Math.PI);
      const alpha = Math.max(0, lengthAlpha * widthAlpha);
      const index = (y * width + x) * 4;

      image.data[index] = 255;
      image.data[index + 1] = 255;
      image.data[index + 2] = 255;
      image.data[index + 3] = Math.round(alpha * 255);
    }
  }

  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

const STREAK_ENTRIES = SHOT_ASSET_OPTIONS.flatMap((asset) =>
  Array.from({ length: SHOT_POOL_SLOTS_PER_ASSET }, (_, slotIndex) => ({
    assetKey: asset.key,
    slotIndex,
  }))
);

// Returns the streak transform for an in-flight projectile, or null when the
// slot is idle/slow and should be hidden.
function resolveStreakMatrix(entry, camera, shotBodiesRef) {
  const body = shotBodiesRef.current?.[entry.assetKey]?.[entry.slotIndex];

  if (!body?.userData?.isActiveThrowable) {
    return null;
  }

  const velocity = body.linvel();

  workVelocity.set(velocity.x, velocity.y, velocity.z);

  const speed = workVelocity.length();

  if (speed < MIN_SPEED) {
    return null;
  }

  const translation = body.translation();

  workPosition.set(translation.x, translation.y, translation.z);
  workDirection.copy(workVelocity).divideScalar(speed);
  workToCamera.copy(camera.position).sub(workPosition).normalize();
  workSide.crossVectors(workDirection, workToCamera);

  if (workSide.lengthSq() < 1e-6) {
    return null;
  }

  workSide.normalize();
  workNormal.crossVectors(workDirection, workSide);

  const length = THREE.MathUtils.clamp(
    speed * LENGTH_PER_SPEED,
    MIN_LENGTH,
    MAX_LENGTH
  );

  workMatrix.makeBasis(
    workDirection.clone().multiplyScalar(length),
    workSide.multiplyScalar(WIDTH),
    workNormal
  );
  // Anchor the bright head at the projectile and trail the tail behind it.
  workPosition.addScaledVector(workDirection, -length * 0.5);
  workMatrix.setPosition(workPosition);

  return workMatrix;
}

/**
 * Renders a pooled set of velocity-stretched streaks that follow whichever
 * trash projectiles are currently in flight, making fast shots easier to read.
 */
export default function TrashStreaks({ shotBodiesRef, enabled = true }) {
  const meshRef = useRef(null);
  const wasHiddenRef = useRef(false);
  const texture = useMemo(() => createStreakTexture(), []);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    for (let index = 0; index < STREAK_ENTRIES.length; index += 1) {
      mesh.setMatrixAt(index, hiddenMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    if (!enabled) {
      if (wasHiddenRef.current) {
        return;
      }

      for (let index = 0; index < STREAK_ENTRIES.length; index += 1) {
        mesh.setMatrixAt(index, hiddenMatrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      wasHiddenRef.current = true;
      return;
    }

    wasHiddenRef.current = false;

    const { camera } = state;

    for (let index = 0; index < STREAK_ENTRIES.length; index += 1) {
      const matrix = resolveStreakMatrix(
        STREAK_ENTRIES[index],
        camera,
        shotBodiesRef
      );

      mesh.setMatrixAt(index, matrix ?? hiddenMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, STREAK_ENTRIES.length]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        color={STREAK_COLOR}
        transparent
        opacity={STREAK_OPACITY}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
