import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import {
  INSTANCED_TRASH_POOL_META,
  POINTER_TAP_THRESHOLD,
  SHOT_ASSET_OPTIONS,
  SHOT_POOL_SLOTS_PER_ASSET,
} from '../utils/sceneData';
import {
  createTrashBlast,
  getNormalizedPointerPosition,
} from '../utils/sceneUtils';

export default function useTrashBlaster() {
  const { camera, gl } = useThree();
  const cameraRef = useRef(camera);
  const pointerDownRef = useRef(null);
  const shotBodiesRef = useRef({});
  const nextShotSlotRef = useRef(
    Object.fromEntries(SHOT_ASSET_OPTIONS.map((asset) => [asset.key, 0]))
  );

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    const { domElement } = gl;

    const fireShot = (pointerPosition = new THREE.Vector2(0, 0)) => {
      const shot = createTrashBlast(cameraRef.current, pointerPosition);
      const poolMeta = INSTANCED_TRASH_POOL_META[shot.asset.key];
      const bodies = shotBodiesRef.current[shot.asset.key];

      if (!poolMeta || !bodies?.length) {
        return;
      }

      const nextSlotOffset = nextShotSlotRef.current[shot.asset.key] ?? 0;
      const slotIndex = nextSlotOffset;
      const body = bodies[slotIndex];

      nextShotSlotRef.current[shot.asset.key] =
        (nextSlotOffset + 1) % SHOT_POOL_SLOTS_PER_ASSET;

      if (!body) {
        return;
      }

      const [x, y, z] = shot.position;
      const [vx, vy, vz] = shot.velocity;
      const [sx, sy, sz] = shot.spin;
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...shot.rotation)
      );

      body.setTranslation({ x, y, z }, true);
      body.setRotation(
        {
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w,
        },
        true
      );
      body.setLinvel({ x: vx, y: vy, z: vz }, true);
      body.setAngvel({ x: sx, y: sy, z: sz }, true);
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) {
        return;
      }

      pointerDownRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handlePointerUp = (event) => {
      const pointerDown = pointerDownRef.current;
      pointerDownRef.current = null;

      if (!pointerDown || event.button !== 0) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - pointerDown.x,
        event.clientY - pointerDown.y
      );

      if (distance <= POINTER_TAP_THRESHOLD) {
        fireShot(
          getNormalizedPointerPosition(event.clientX, event.clientY, domElement)
        );
      }
    };

    const handleKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat) {
        return;
      }

      event.preventDefault();
      fireShot();
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gl]);

  return shotBodiesRef;
}
