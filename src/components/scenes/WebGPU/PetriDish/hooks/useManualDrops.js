import { useEffect } from 'react';

import * as THREE from 'three/webgpu';

import createFocusPicker from '../utils/focusPicker';

const scratchNdc = new THREE.Vector2();
// Orbiting is a pointerdown-drag-pointerup on the same canvas, so a drop has
// to wait for the release and only count if the pointer barely moved — firing
// on pointerdown would spray seeds every time the camera is turned.
const CLICK_SLOP_PX = 4;

export default function useManualDrops({
  camera,
  enabled,
  gl,
  groundY,
  onDrop,
}) {
  useEffect(() => {
    const element = gl?.domElement;
    if (!enabled || !element || !camera) return undefined;

    const pickPoint = createFocusPicker({ groundY });
    let downX = 0;
    let downY = 0;

    const handleDown = (event) => {
      downX = event.clientX;
      downY = event.clientY;
    };

    const handleUp = (event) => {
      const travelled = Math.hypot(
        event.clientX - downX,
        event.clientY - downY
      );
      if (travelled > CLICK_SLOP_PX) return;

      const rect = element.getBoundingClientRect();
      scratchNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const point = pickPoint(scratchNdc, camera);
      if (point) onDrop(point);
    };

    element.addEventListener('pointerdown', handleDown);
    element.addEventListener('pointerup', handleUp);

    return () => {
      element.removeEventListener('pointerdown', handleDown);
      element.removeEventListener('pointerup', handleUp);
    };
  }, [camera, enabled, gl, groundY, onDrop]);
}
