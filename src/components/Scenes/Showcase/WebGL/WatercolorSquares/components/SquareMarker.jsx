import * as THREE from 'three';

import React, { forwardRef, useEffect, useMemo } from 'react';

const ROTATION_45 = Math.PI / 4;

function makeOutlineGeometry(size) {
  const h = size / 2;
  const verts = new Float32Array([
    -h,
    -h,
    0,
    h,
    -h,
    0,
    h,
    -h,
    0,
    h,
    h,
    0,
    h,
    h,
    0,
    -h,
    h,
    0,
    -h,
    h,
    0,
    -h,
    -h,
    0,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  return geo;
}

/**
 * A single filled square (PlaneGeometry) rendered as a diamond (rotated 45°).
 */
export function FilledSquare({ position, size, color }) {
  return (
    <mesh position={position} rotation-z={ROTATION_45}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/**
 * A single outlined square (LineSegments) rendered as a diamond (rotated 45°).
 * Accepts a ref that resolves to the underlying THREE.LineSegments object,
 * allowing imperative position updates in useFrame.
 */
export const OutlinedSquare = forwardRef(function OutlinedSquare(
  { position, size, color },
  ref
) {
  const obj = useMemo(() => {
    const geo = makeOutlineGeometry(size);
    const mat = new THREE.LineBasicMaterial({ color });
    return new THREE.LineSegments(geo, mat);
  }, [size, color]);

  useEffect(() => {
    return () => {
      obj.geometry.dispose();
      obj.material.dispose();
    };
  }, [obj]);

  return (
    <primitive
      ref={ref}
      object={obj}
      position={position}
      rotation-z={ROTATION_45}
    />
  );
});
