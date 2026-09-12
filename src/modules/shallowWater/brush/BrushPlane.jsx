import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import pickBed from './pickBed';

const FLAT = [-Math.PI / 2, 0, 0];

// The catch surface for a stroke. It exists only to give R3F's raycaster
// something to report a ray against -- where on the ground that ray actually
// lands is solved in pickBed against the baked bed, not taken from this
// plane's own hit point.
//
// Orbit is switched off for the length of a stroke. Without that a drag turns
// the camera and sculpts at the same time, and the stroke lands somewhere
// other than where it was drawn.
function BrushPlane({ field, resolution, strokeRef, worldSize }) {
  const controls = useThree((state) => state.controls);
  const orbitRef = useRef(true);
  const point = useMemo(() => new THREE.Vector3(), []);

  const track = useCallback(
    (event, begin) => {
      const hit = pickBed(field, resolution, worldSize, event.ray, point);
      if (!hit) return;

      const stroke = strokeRef.current;
      if (!begin && stroke.active) {
        stroke.dx += hit.x - stroke.x;
        stroke.dz += hit.z - stroke.z;
      }
      stroke.x = hit.x;
      stroke.z = hit.z;
      stroke.active = true;
    },
    [field, point, resolution, strokeRef, worldSize]
  );

  const handleDown = useCallback(
    (event) => {
      event.stopPropagation();
      event.target.setPointerCapture(event.pointerId);
      if (controls) {
        orbitRef.current = controls.enabled;
        controls.enabled = false;
      }
      const stroke = strokeRef.current;
      stroke.dx = 0;
      stroke.dz = 0;
      track(event, true);
    },
    [controls, strokeRef, track]
  );

  const handleMove = useCallback(
    (event) => {
      if (!strokeRef.current.active) return;
      event.stopPropagation();
      track(event, false);
    },
    [strokeRef, track]
  );

  // Sculpt being switched off, or a preset switching it off, unmounts this
  // mid-stroke and no pointer-up ever arrives. Without this the camera stays
  // locked for the rest of the session and nothing says why.
  useEffect(
    () => () => {
      const stroke = strokeRef.current;
      if (!stroke.active) return;
      stroke.active = false;
      if (controls) controls.enabled = orbitRef.current;
    },
    [controls, strokeRef]
  );

  const handleUp = useCallback(
    (event) => {
      event.target.releasePointerCapture?.(event.pointerId);
      if (controls) controls.enabled = orbitRef.current;
      const stroke = strokeRef.current;
      stroke.active = false;
      stroke.dx = 0;
      stroke.dz = 0;
    },
    [controls, strokeRef]
  );

  return (
    <mesh
      rotation={FLAT}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerOut={handleUp}
      onPointerUp={handleUp}
    >
      <planeGeometry args={[worldSize, worldSize]} />
      <meshBasicMaterial depthWrite={false} opacity={0} transparent />
    </mesh>
  );
}

export default memo(BrushPlane);
