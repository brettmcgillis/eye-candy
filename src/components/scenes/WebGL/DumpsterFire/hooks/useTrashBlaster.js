import { useCallback, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';

import * as THREE from 'three';

import {
  DEFAULT_SHOT_TUNING,
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
import useThrowWhooshAudio from './useThrowWhooshAudio';
import useTrashBlasterStore from './useTrashBlasterStore';

const DRAG_RELEASE_SPEED_LIMIT = 12;
const LID_DRAG_RADIANS_PER_PIXEL = 0.014;
// How far (world units) the trash winds back mid-hold before release.
const WINDUP_PULL = 0.35;

const sharedRaycaster = new THREE.Raycaster();
const sharedCameraDirection = new THREE.Vector3();
const sharedDragPlane = new THREE.Plane();
const sharedDragIntersection = new THREE.Vector3();
const sharedDragTarget = new THREE.Vector3();
const sharedBodyPosition = new THREE.Vector3();
const sharedWindUpPosition = new THREE.Vector3();

function clampVectorLength(vector, maxLength) {
  if (vector.lengthSq() <= maxLength * maxLength) {
    return vector;
  }

  return vector.setLength(maxLength);
}

function buildBodyDragSession({ body, point, clientX, clientY, camera }) {
  const translation = body.translation();
  const rotation = body.rotation();

  sharedBodyPosition.set(translation.x, translation.y, translation.z);
  camera.getWorldDirection(sharedCameraDirection);

  return {
    kind: 'body',
    started: false,
    body,
    startClientX: clientX,
    startClientY: clientY,
    planePoint: point.clone(),
    planeNormal: sharedCameraDirection.clone(),
    dragOffset: sharedBodyPosition.clone().sub(point),
    lockedRotation: new THREE.Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    ),
    releaseVelocity: new THREE.Vector3(),
    lastTargetPosition: sharedBodyPosition.clone(),
    lastMovedAt: performance.now(),
    originalBodyType: body.bodyType(),
  };
}

function hydrateInteractiveSession(interaction, camera) {
  if (!interaction) {
    return null;
  }

  if (interaction.kind === 'body') {
    return buildBodyDragSession({ ...interaction, camera });
  }

  if (interaction.kind === 'lid') {
    return {
      ...interaction,
      started: false,
    };
  }

  return null;
}

function startBodyDragSession(session, rapier) {
  const { body } = session;

  body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.setNextKinematicTranslation(session.lastTargetPosition);
  body.setNextKinematicRotation(session.lockedRotation);
  body.wakeUp?.();

  // eslint-disable-next-line no-param-reassign
  session.lastMovedAt = performance.now();
}

function updateBodyDragSession(session, clientX, clientY, domElement, camera) {
  const { body } = session;
  const { releaseVelocity } = session;
  const { lastTargetPosition } = session;
  const pointerPosition = getNormalizedPointerPosition(
    clientX,
    clientY,
    domElement
  );

  sharedRaycaster.setFromCamera(pointerPosition, camera);
  sharedDragPlane.setFromNormalAndCoplanarPoint(
    session.planeNormal,
    session.planePoint
  );

  if (
    !sharedRaycaster.ray.intersectPlane(sharedDragPlane, sharedDragIntersection)
  ) {
    return;
  }

  sharedDragTarget.copy(sharedDragIntersection).add(session.dragOffset);
  body.setNextKinematicTranslation(sharedDragTarget);
  body.setNextKinematicRotation(session.lockedRotation);

  const now = performance.now();
  const deltaSeconds = Math.max((now - session.lastMovedAt) / 1000, 1 / 120);

  releaseVelocity
    .copy(sharedDragTarget)
    .sub(lastTargetPosition)
    .divideScalar(deltaSeconds);
  clampVectorLength(releaseVelocity, DRAG_RELEASE_SPEED_LIMIT);
  lastTargetPosition.copy(sharedDragTarget);

  // eslint-disable-next-line no-param-reassign
  session.lastMovedAt = now;
}

function endBodyDragSession(session, rapier) {
  if (!session.started) {
    return;
  }

  session.body.setTranslation(session.lastTargetPosition, true);
  session.body.setBodyType(
    session.originalBodyType ?? rapier.RigidBodyType.Dynamic,
    true
  );
  session.body.setLinvel(session.releaseVelocity, true);
  session.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  session.body.wakeUp?.();
}

function updateLidDragSession(session, clientX, clientY) {
  const { angleRef } = session;
  const { applyDraggedAngle } = session;
  const nextAngle = session.getDraggedAngle
    ? session.getDraggedAngle(clientX, clientY)
    : session.normalizeAngle(
        session.startAngle +
          (clientY - session.startClientY) *
            (session.radiansPerPixel ?? LID_DRAG_RADIANS_PER_PIXEL)
      );

  angleRef.current = nextAngle;
  applyDraggedAngle?.(nextAngle);
}

function setThrowableActiveState(body, isActiveThrowable) {
  if (!body) {
    return;
  }

  const targetBody = body;

  targetBody.userData = {
    ...targetBody.userData,
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

export default function useTrashBlaster(shotConfig = DEFAULT_SHOT_TUNING) {
  const { camera, gl } = useThree();
  const { rapier } = useRapier();
  const cameraRef = useRef(camera);
  const pointerDownRef = useRef(null);
  const shotConfigRef = useRef(shotConfig);
  const shotBodiesRef = useRef({});
  const pendingWindUpsRef = useRef([]);
  const playWhoosh = useThrowWhooshAudio();
  const emitThrow = useTrashBlasterStore((s) => s.emitThrow);
  const markThrowableSpawned = useTrashBlasterStore(
    (s) => s.markThrowableSpawned
  );
  const registerClearTrashHandler = useTrashBlasterStore(
    (s) => s.registerClearTrashHandler
  );
  const registerFireTrashHandler = useTrashBlasterStore(
    (s) => s.registerFireTrashHandler
  );
  const setPointerInteractionActive = useTrashBlasterStore(
    (s) => s.setPointerInteractionActive
  );
  const setHasThrowables = useTrashBlasterStore((s) => s.setHasThrowables);
  const unregisterClearTrashHandler = useTrashBlasterStore(
    (s) => s.unregisterClearTrashHandler
  );
  const unregisterFireTrashHandler = useTrashBlasterStore(
    (s) => s.unregisterFireTrashHandler
  );
  const nextShotSlotRef = useRef(
    Object.fromEntries(SHOT_ASSET_OPTIONS.map((asset) => [asset.key, 0]))
  );

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    shotConfigRef.current = shotConfig;
  }, [shotConfig]);

  const launchShot = useCallback(
    (body, shot, quaternion) => {
      const [x, y, z] = shot.position;
      const [vx, vy, vz] = shot.velocity;
      const [sx, sy, sz] = shot.spin;

      body.setBodyType(rapier.RigidBodyType.Dynamic, true);
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

      const speed = Math.hypot(vx, vy, vz) || 1;

      playWhoosh(shotConfigRef.current.whooshEnabled !== false);
      emitThrow({
        position: shot.position,
        direction: [vx / speed, vy / speed, vz / speed],
        speed,
      });
    },
    [emitThrow, markThrowableSpawned, playWhoosh, rapier]
  );

  const beginWindUp = useCallback(
    (body, shot, quaternion, duration) => {
      const [x, y, z] = shot.position;

      body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.setNextKinematicTranslation({ x, y, z });
      body.setNextKinematicRotation(quaternion);
      setThrowableActiveState(body, true);
      body.wakeUp?.();

      const backDir = new THREE.Vector3();
      cameraRef.current.getWorldDirection(backDir);
      backDir.negate();

      const startedAt = performance.now();

      pendingWindUpsRef.current.push({
        body,
        shot,
        quaternion,
        base: new THREE.Vector3(x, y, z),
        backDir,
        startedAt,
        releaseAt: startedAt + duration * 1000,
      });
    },
    [rapier]
  );

  const fireShot = useCallback(
    (pointerPosition = new THREE.Vector2(0, 0)) => {
      const config = shotConfigRef.current;
      const shot = createTrashBlast(cameraRef.current, pointerPosition, config);
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

      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...shot.rotation)
      );

      const windUpDuration = config.windUpEnabled
        ? Math.max(0, config.windUpDuration ?? 0)
        : 0;

      if (windUpDuration > 0) {
        beginWindUp(body, shot, quaternion, windUpDuration);
      } else {
        launchShot(body, shot, quaternion);
      }
    },
    [beginWindUp, launchShot]
  );

  useEffect(() => {
    registerFireTrashHandler(fireShot);

    return () => {
      unregisterFireTrashHandler();
    };
  }, [fireShot, registerFireTrashHandler, unregisterFireTrashHandler]);

  useFrame(() => {
    const pendingWindUps = pendingWindUpsRef.current;

    if (pendingWindUps.length) {
      const now = performance.now();
      const stillWinding = [];

      pendingWindUps.forEach((windUp) => {
        if (now >= windUp.releaseAt) {
          launchShot(windUp.body, windUp.shot, windUp.quaternion);
          return;
        }

        const progress =
          (now - windUp.startedAt) / (windUp.releaseAt - windUp.startedAt);
        const bob = Math.sin(progress * Math.PI) * WINDUP_PULL;

        sharedWindUpPosition
          .copy(windUp.base)
          .addScaledVector(windUp.backDir, bob);
        windUp.body.setNextKinematicTranslation({
          x: sharedWindUpPosition.x,
          y: sharedWindUpPosition.y,
          z: sharedWindUpPosition.z,
        });
        windUp.body.setNextKinematicRotation(windUp.quaternion);
        stillWinding.push(windUp);
      });

      pendingWindUpsRef.current = stillWinding;
    }

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
      pendingWindUpsRef.current.forEach((windUp) => {
        windUp.body.setBodyType(rapier.RigidBodyType.Dynamic, true);
      });
      pendingWindUpsRef.current = [];

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
  }, [rapier, registerClearTrashHandler, unregisterClearTrashHandler]);

  useEffect(() => {
    const { domElement } = gl;

    const isPointerOverCanvas = (clientX, clientY) => {
      const rect = domElement.getBoundingClientRect();

      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    };

    const applyCursor = (cursor) => {
      if (document.body.style.cursor !== cursor) {
        document.body.style.cursor = cursor;
      }
    };

    const resolveInteractiveSession = (clientX, clientY) => {
      const pointerPosition = getNormalizedPointerPosition(
        clientX,
        clientY,
        domElement
      );
      const interactiveTargets = Object.values(
        useTrashBlasterStore.getState().interactiveTargets
      );
      let nearestSession = null;

      sharedRaycaster.setFromCamera(pointerPosition, cameraRef.current);

      interactiveTargets.forEach((target) => {
        const object = target.getObject?.();

        if (!object) {
          return;
        }

        const intersections = sharedRaycaster.intersectObject(object, true);

        for (let index = 0; index < intersections.length; index += 1) {
          const interaction = target.buildSession?.({
            intersection: intersections[index],
            clientX,
            clientY,
            camera: cameraRef.current,
            domElement,
          });

          if (interaction) {
            if (
              !nearestSession ||
              intersections[index].distance < nearestSession.distance
            ) {
              nearestSession = {
                distance: intersections[index].distance,
                session: hydrateInteractiveSession(
                  interaction,
                  cameraRef.current
                ),
              };
            }

            break;
          }
        }
      });

      return nearestSession?.session ?? null;
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) {
        return;
      }

      const interaction = resolveInteractiveSession(
        event.clientX,
        event.clientY
      );

      pointerDownRef.current = {
        x: event.clientX,
        y: event.clientY,
        interaction,
      };

      setPointerInteractionActive(Boolean(interaction));

      if (interaction) {
        applyCursor('grabbing');
      }
    };

    const handlePointerMove = (event) => {
      const pointerDown = pointerDownRef.current;
      const interaction = pointerDown?.interaction;

      if (!interaction) {
        if (!pointerDown) {
          const isHovering =
            isPointerOverCanvas(event.clientX, event.clientY) &&
            Boolean(resolveInteractiveSession(event.clientX, event.clientY));

          applyCursor(isHovering ? 'grab' : 'auto');
        }

        return;
      }

      const distance = Math.hypot(
        event.clientX - pointerDown.x,
        event.clientY - pointerDown.y
      );

      if (!interaction.started && distance <= POINTER_TAP_THRESHOLD) {
        return;
      }

      if (!interaction.started) {
        if (interaction.kind === 'body') {
          startBodyDragSession(interaction, rapier);
        }

        interaction.started = true;
      }

      if (interaction.kind === 'body') {
        updateBodyDragSession(
          interaction,
          event.clientX,
          event.clientY,
          domElement,
          cameraRef.current
        );
        return;
      }

      if (interaction.kind === 'lid') {
        updateLidDragSession(interaction, event.clientX, event.clientY);
      }
    };

    const handlePointerUp = (event) => {
      const pointerDown = pointerDownRef.current;
      pointerDownRef.current = null;

      setPointerInteractionActive(false);

      const isHovering =
        isPointerOverCanvas(event.clientX, event.clientY) &&
        Boolean(resolveInteractiveSession(event.clientX, event.clientY));

      applyCursor(isHovering ? 'grab' : 'auto');

      if (!pointerDown || event.button !== 0) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - pointerDown.x,
        event.clientY - pointerDown.y
      );

      if (pointerDown.interaction) {
        if (pointerDown.interaction.kind === 'body') {
          if (
            !pointerDown.interaction.started &&
            distance <= POINTER_TAP_THRESHOLD
          ) {
            fireShot(
              getNormalizedPointerPosition(
                event.clientX,
                event.clientY,
                domElement
              )
            );
          } else {
            endBodyDragSession(pointerDown.interaction, rapier);
          }
          return;
        }

        if (
          pointerDown.interaction.kind === 'lid' &&
          !pointerDown.interaction.started &&
          distance <= POINTER_TAP_THRESHOLD
        ) {
          fireShot(
            getNormalizedPointerPosition(
              event.clientX,
              event.clientY,
              domElement
            )
          );
        }

        return;
      }

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

    const cancelInteraction = () => {
      const activePointerDown = pointerDownRef.current;
      pointerDownRef.current = null;
      setPointerInteractionActive(false);
      applyCursor('auto');

      if (activePointerDown?.interaction?.kind === 'body') {
        endBodyDragSession(activePointerDown.interaction, rapier);
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', cancelInteraction);
    window.addEventListener('blur', cancelInteraction);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      setPointerInteractionActive(false);
      applyCursor('auto');
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', cancelInteraction);
      window.removeEventListener('blur', cancelInteraction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fireShot, gl, rapier, setPointerInteractionActive]);

  return { shotBodiesRef };
}
