import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  INSTANCED_TRASH_POOL_META,
  POINTER_TAP_THRESHOLD,
  SHOT_ASSET_OPTIONS,
  SHOT_POOL_SLOTS_PER_ASSET,
  TRASH_CLEANUP_PLANE_Y,
} from '../utils/sceneData';
import {
  createTrashBlast,
  getNormalizedPointerPosition,
  getParkedShotPosition,
} from '../utils/sceneUtils';
import useTrashBlasterStore from './useTrashBlasterStore';

function setThrowableActiveState(body, isActiveThrowable) {
  if (!body) {
    return;
  }

  body.userData = {
    ...body.userData,
    isActiveThrowable,
  };
}

function parkShotBody(body, assetKey, slotIndex) {
  if (!body) {
    return;
  }

  const [x, y, z] = getParkedShotPosition(assetKey, slotIndex);

  body.setTranslation({ x, y, z }, true);
  body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  setThrowableActiveState(body, false);
}

function hasActiveShotBodies(shotBodiesMap) {
  return Object.values(shotBodiesMap).some((bodies) =>
    bodies?.some((body) => body?.userData?.isActiveThrowable)
  );
}

export default function useTrashBlaster() {
  const { camera, gl } = useThree();
  const cameraRef = useRef(camera);
  const pointerDownRef = useRef(null);
  const shotBodiesRef = useRef({});
  const markThrowableSpawned = useTrashBlasterStore(
    (s) => s.markThrowableSpawned
  );
  const registerClearTrashHandler = useTrashBlasterStore(
    (s) => s.registerClearTrashHandler
  );
  const setHasThrowables = useTrashBlasterStore((s) => s.setHasThrowables);
  const unregisterClearTrashHandler = useTrashBlasterStore(
    (s) => s.unregisterClearTrashHandler
  );
  const nextShotSlotRef = useRef(
    Object.fromEntries(SHOT_ASSET_OPTIONS.map((asset) => [asset.key, 0]))
  );

  const recycleShotBody = (body) => {
    const { assetKey, slotIndex } = body?.userData ?? {};

    if (typeof assetKey !== 'string' || typeof slotIndex !== 'number') {
      return;
    }

    parkShotBody(body, assetKey, slotIndex);
    setHasThrowables(hasActiveShotBodies(shotBodiesRef.current));
  };

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useFrame(() => {
    let recycledShot = false;

    SHOT_ASSET_OPTIONS.forEach((asset) => {
      const bodies = shotBodiesRef.current[asset.key];

      bodies?.forEach((body, slotIndex) => {
        if (!body?.userData?.isActiveThrowable) {
          return;
        }

        if (body.translation().y > TRASH_CLEANUP_PLANE_Y) {
          return;
        }

        parkShotBody(body, asset.key, slotIndex);
        recycledShot = true;
      });
    });

    if (recycledShot) {
      setHasThrowables(hasActiveShotBodies(shotBodiesRef.current));
    }
  });

  useEffect(() => {
    const clearTrash = () => {
      SHOT_ASSET_OPTIONS.forEach((asset) => {
        const bodies = shotBodiesRef.current[asset.key];

        bodies?.forEach((body, slotIndex) => {
          parkShotBody(body, asset.key, slotIndex);
        });
      });

      nextShotSlotRef.current = Object.fromEntries(
        SHOT_ASSET_OPTIONS.map((asset) => [asset.key, 0])
      );
    };

    registerClearTrashHandler(clearTrash);

    return () => {
      unregisterClearTrashHandler();
    };
  }, [registerClearTrashHandler, unregisterClearTrashHandler]);

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
      setThrowableActiveState(body, true);
      body.wakeUp?.();
      markThrowableSpawned();
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
  }, [gl, markThrowableSpawned]);

  return { shotBodiesRef };
}
