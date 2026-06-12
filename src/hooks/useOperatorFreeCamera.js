import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const CAMERA_EULER_ORDER = 'YXZ';
const MAX_PITCH = Math.PI / 2 - 0.01;

const sharedEuler = new THREE.Euler(0, 0, 0, CAMERA_EULER_ORDER);
const sharedForward = new THREE.Vector3();
const sharedRight = new THREE.Vector3();
const sharedUp = new THREE.Vector3(0, 1, 0);

function clampPitch(value) {
  return THREE.MathUtils.clamp(value, -MAX_PITCH, MAX_PITCH);
}

export default function useOperatorFreeCamera({
  enabled = false,
  inputRef,
  config,
  shouldBlockPointerLook,
} = {}) {
  const { camera, gl } = useThree();
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const pointerDragRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const pointerLookDeltaRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      pointerDragRef.current.active = false;
      return;
    }

    sharedEuler.setFromQuaternion(camera.quaternion, CAMERA_EULER_ORDER);
    yawRef.current = sharedEuler.y;
    pitchRef.current = clampPitch(sharedEuler.x);
  }, [camera, enabled]);

  useEffect(() => {
    const { domElement } = gl;

    if (!enabled) {
      return undefined;
    }

    const startPointerDrag = (event) => {
      if (event.button !== 0) {
        return;
      }

      pointerDragRef.current.active = true;
      pointerDragRef.current.lastX = event.clientX;
      pointerDragRef.current.lastY = event.clientY;
    };

    const stopPointerDrag = () => {
      pointerDragRef.current.active = false;
    };

    const updatePointerDrag = (event) => {
      if (!pointerDragRef.current.active) {
        return;
      }

      const deltaX = event.clientX - pointerDragRef.current.lastX;
      const deltaY = event.clientY - pointerDragRef.current.lastY;

      pointerDragRef.current.lastX = event.clientX;
      pointerDragRef.current.lastY = event.clientY;

      if (shouldBlockPointerLook?.()) {
        return;
      }

      pointerLookDeltaRef.current.x += deltaX;
      pointerLookDeltaRef.current.y += deltaY;
    };

    domElement.addEventListener('pointerdown', startPointerDrag);
    window.addEventListener('pointermove', updatePointerDrag);
    window.addEventListener('pointerup', stopPointerDrag);
    window.addEventListener('pointercancel', stopPointerDrag);
    window.addEventListener('blur', stopPointerDrag);

    return () => {
      domElement.removeEventListener('pointerdown', startPointerDrag);
      window.removeEventListener('pointermove', updatePointerDrag);
      window.removeEventListener('pointerup', stopPointerDrag);
      window.removeEventListener('pointercancel', stopPointerDrag);
      window.removeEventListener('blur', stopPointerDrag);
    };
  }, [enabled, gl, shouldBlockPointerLook]);

  useFrame((_, deltaSeconds) => {
    if (!enabled || !inputRef?.current) {
      return;
    }

    const input = inputRef.current;
    const pointerLookDelta = pointerLookDeltaRef.current;
    const boostMultiplier = input.boost ? config.boostMultiplier : 1;
    const moveSpeed = config.moveSpeed * boostMultiplier;
    const liftSpeed = config.liftSpeed * boostMultiplier;

    if (
      pointerLookDelta.x ||
      pointerLookDelta.y ||
      input.lookX ||
      input.lookY
    ) {
      yawRef.current -=
        pointerLookDelta.x * config.pointerLookSensitivity +
        input.lookX * config.stickLookSpeed * deltaSeconds;
      pitchRef.current = clampPitch(
        pitchRef.current -
          pointerLookDelta.y * config.pointerLookSensitivity -
          input.lookY * config.stickLookSpeed * deltaSeconds
      );
      pointerLookDelta.x = 0;
      pointerLookDelta.y = 0;
    }

    sharedEuler.set(pitchRef.current, yawRef.current, 0, CAMERA_EULER_ORDER);
    camera.quaternion.setFromEuler(sharedEuler);

    sharedRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    sharedForward.set(0, 0, -1).applyQuaternion(camera.quaternion);

    if (input.moveX) {
      camera.position.addScaledVector(
        sharedRight,
        input.moveX * moveSpeed * deltaSeconds
      );
    }

    if (input.moveY) {
      camera.position.addScaledVector(
        sharedUp,
        input.moveY * liftSpeed * deltaSeconds
      );
    }

    if (input.moveZ) {
      camera.position.addScaledVector(
        sharedForward,
        -input.moveZ * moveSpeed * deltaSeconds
      );
    }

    if (input.zoom) {
      camera.fov = THREE.MathUtils.clamp(
        camera.fov - input.zoom * config.zoomSpeed * deltaSeconds,
        config.minFov,
        config.maxFov
      );
      camera.updateProjectionMatrix();
    }
  });
}
