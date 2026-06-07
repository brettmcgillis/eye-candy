import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

const raycaster = new THREE.Raycaster();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();

export default function usePointerState({ mode = 'press' } = {}) {
  const { camera, gl } = useThree();
  const pointRef = useRef(new THREE.Vector3(1000, 1000, 1000));
  const uvRef = useRef(new THREE.Vector2(0.5, 0.5));
  const activeRef = useRef(false);
  const pressedRef = useRef(false);

  useEffect(() => {
    const element = gl.domElement;

    function updatePoint(clientX, clientY) {
      const rect = element.getBoundingClientRect();
      const u = (clientX - rect.left) / rect.width;
      const v = 1 - (clientY - rect.top) / rect.height;
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      uvRef.current.set(u, v);

      raycaster.setFromCamera({ x, y }, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
        pointRef.current.copy(hitPoint);
      }
    }

    function onPointerDown(event) {
      pressedRef.current = true;
      updatePoint(event.clientX, event.clientY);
      activeRef.current = true;
    }

    function onPointerUp() {
      pressedRef.current = false;
      if (mode === 'press') activeRef.current = false;
    }

    function onPointerLeave() {
      pressedRef.current = false;
      activeRef.current = false;
    }

    function onPointerMove(event) {
      updatePoint(event.clientX, event.clientY);

      if (mode === 'hover') {
        activeRef.current = true;
      } else {
        activeRef.current = pressedRef.current;
      }
    }

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointerleave', onPointerLeave);
    element.addEventListener('pointercancel', onPointerLeave);
    element.addEventListener('pointermove', onPointerMove);
    window.addEventListener('blur', onPointerLeave);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointerleave', onPointerLeave);
      element.removeEventListener('pointercancel', onPointerLeave);
      element.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onPointerLeave);
    };
  }, [camera, gl, mode]);

  return {
    pointerPoint: pointRef,
    pointerUv: uvRef,
    pointerActive: activeRef,
  };
}
