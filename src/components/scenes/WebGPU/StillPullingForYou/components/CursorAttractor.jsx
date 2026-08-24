import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

const DEFAULT_DIRECTION = Object.freeze([0, 1, 0]);
const DEFAULT_FALLBACK_POSITION = Object.freeze([0, -10, 0]);

const raycaster = new THREE.Raycaster();
const planeNormal = new THREE.Vector3(0, 0, 1);
const plane = new THREE.Plane();
const intersectionPoint = new THREE.Vector3();

function toTuple(vector) {
  return [vector.x, vector.y, vector.z];
}

export default function CursorAttractor({
  attractorsRef,
  enabled,
  mode,
  radius,
  strength,
  visible,
  planeZ = 0,
  direction = DEFAULT_DIRECTION,
  fallbackPosition = DEFAULT_FALLBACK_POSITION,
}) {
  const attractorStore = attractorsRef;
  const { camera, gl } = useThree();
  const markerRef = useRef(null);
  const pointerNdcRef = useRef(new THREE.Vector2());
  const hasPointerRef = useRef(false);
  const fallback = useMemo(() => [...fallbackPosition], [fallbackPosition]);
  const attractorDirection = useMemo(() => [...direction], [direction]);

  useEffect(() => {
    attractorStore.current = [
      {
        position: [...fallback],
        direction: [...attractorDirection],
        rotation: [0, 0, 0],
        type: mode,
        radius,
        strength,
      },
    ];

    return () => {
      attractorStore.current = [
        {
          position: [...fallback],
          direction: [...attractorDirection],
          rotation: [0, 0, 0],
          type: mode,
          radius,
          strength,
        },
      ];
    };
  }, [attractorStore, attractorDirection, fallback, mode, radius, strength]);

  useEffect(() => {
    const nextAttractor = attractorStore.current[0] ?? {
      position: [...fallback],
      direction: [...attractorDirection],
      rotation: [0, 0, 0],
      type: mode,
    };

    attractorStore.current[0] = {
      ...nextAttractor,
      direction: [...attractorDirection],
      type: mode,
      radius,
      strength,
    };

    if (!enabled) {
      attractorStore.current[0].position = [...fallback];
    }
  }, [
    attractorStore,
    attractorDirection,
    enabled,
    fallback,
    mode,
    radius,
    strength,
  ]);

  useEffect(() => {
    const element = gl.domElement;

    const resetPointer = () => {
      hasPointerRef.current = false;
      const nextAttractor = attractorStore.current[0];

      if (nextAttractor) {
        nextAttractor.position = [...fallback];
      }
    };

    const updatePointer = (clientX, clientY) => {
      const rect = element.getBoundingClientRect();
      pointerNdcRef.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -(((clientY - rect.top) / rect.height) * 2 - 1)
      );
      hasPointerRef.current = true;
    };

    const handlePointerMove = (event) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handlePointerDown = (event) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handlePointerUp = (event) => {
      if (event.pointerType !== 'mouse') {
        resetPointer();
      }
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerleave', resetPointer);
    element.addEventListener('pointercancel', resetPointer);
    element.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('blur', resetPointer);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', resetPointer);
      element.removeEventListener('pointercancel', resetPointer);
      element.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('blur', resetPointer);
    };
  }, [attractorStore, fallback, gl]);

  useFrame(() => {
    const attractor = attractorStore.current[0];
    const marker = markerRef.current;

    if (!attractor) {
      return;
    }

    if (!enabled) {
      attractor.position = [...fallback];

      if (marker) {
        marker.visible = false;
      }

      return;
    }

    if (!hasPointerRef.current) {
      if (marker) {
        marker.visible = false;
      }
      return;
    }

    plane.set(planeNormal, -planeZ);
    raycaster.setFromCamera(pointerNdcRef.current, camera);

    if (!raycaster.ray.intersectPlane(plane, intersectionPoint)) {
      attractor.position = [...fallback];
      if (marker) {
        marker.visible = false;
      }
      return;
    }

    attractor.position = toTuple(intersectionPoint);

    if (!marker) {
      return;
    }

    marker.visible = visible;
    marker.position.copy(intersectionPoint);
  });

  return (
    <group ref={markerRef} visible={false}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshBasicMaterial
          color={mode === 'repeller' ? '#44a6ff' : '#ff4466'}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius, 32, 16]} />
        <meshBasicMaterial
          color={mode === 'repeller' ? '#44a6ff' : '#ff4466'}
          wireframe
          transparent
          opacity={0.14}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}
