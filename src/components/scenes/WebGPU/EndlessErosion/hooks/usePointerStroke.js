import { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { PAINT_BASE_HEIGHT } from '@modules/terrainErosion';

const ray = new THREE.Ray();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PAINT_BASE_HEIGHT);
const hit = new THREE.Vector3();

// Pointer position resolved against the terrain's base plane rather than any
// geometry, so the brush works the same whether the view is a marched field or a
// displaced mesh.
export default function usePointerStroke(enabled) {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);
  const strokeRef = useRef({ active: false, lower: false, u: 0.5, v: 0.5 });

  useEffect(() => {
    if (!enabled) {
      strokeRef.current.active = false;
      return undefined;
    }

    const stroke = strokeRef.current;

    const locate = (event) => {
      const bounds = domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
      );

      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction
        .set(ndc.x, ndc.y, 0.5)
        .unproject(camera)
        .sub(ray.origin)
        .normalize();

      if (!ray.intersectPlane(plane, hit)) {
        return;
      }

      stroke.u = hit.x + 0.5;
      stroke.v = hit.z + 0.5;
    };

    const onDown = (event) => {
      stroke.active = true;
      stroke.lower = event.shiftKey;
      locate(event);
    };
    const onMove = (event) => {
      stroke.lower = event.shiftKey;
      if (stroke.active) {
        locate(event);
      }
    };
    const onUp = () => {
      stroke.active = false;
    };

    domElement.addEventListener('pointerdown', onDown);
    domElement.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      domElement.removeEventListener('pointerdown', onDown);
      domElement.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [camera, domElement, enabled]);

  return strokeRef;
}
