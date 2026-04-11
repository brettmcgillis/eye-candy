import * as THREE from 'three';

import React, { forwardRef, useEffect, useMemo } from 'react';

/**
 * Builds a rectangular ring ShapeGeometry (outer rect minus inner rect hole).
 * For square rings pass equal width and height.
 */
export function makeRectRingGeometry(width, height, thickness) {
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const innerHalfW = Math.max(0, halfW - thickness);
  const innerHalfH = Math.max(0, halfH - thickness);

  const shape = new THREE.Shape();
  shape.moveTo(-halfW, -halfH);
  shape.lineTo(halfW, -halfH);
  shape.lineTo(halfW, halfH);
  shape.lineTo(-halfW, halfH);
  shape.closePath();

  if (innerHalfW > 0 && innerHalfH > 0) {
    const hole = new THREE.Path();
    hole.moveTo(-innerHalfW, -innerHalfH);
    hole.lineTo(innerHalfW, -innerHalfH);
    hole.lineTo(innerHalfW, innerHalfH);
    hole.lineTo(-innerHalfW, innerHalfH);
    hole.closePath();
    shape.holes.push(hole);
  }

  return new THREE.ShapeGeometry(shape);
}

/**
 * Axis-aligned filled square (or rectangle when width ≠ height).
 */
export const FilledSquare = forwardRef(function FilledSquare(
  { position, size, width, height, color, extraRotation = 0 },
  ref
) {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <mesh ref={ref} position={position} rotation-z={extraRotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
});

/**
 * Axis-aligned outlined square (or rectangle) rendered as a mesh ring
 * (outer minus inner shape). Uses ShapeGeometry so lineThickness is a real
 * world-unit value, not a WebGL linewidth (which is capped at 1px on most GPUs).
 */
export const OutlinedSquare = forwardRef(function OutlinedSquare(
  { position, size, width, height, color, lineThickness, extraRotation = 0 },
  ref
) {
  const w = width ?? size;
  const h = height ?? size;
  const thickness = lineThickness ?? Math.min(w, h) * 0.15;

  const geo = useMemo(
    () => makeRectRingGeometry(w, h, thickness),
    [w, h, thickness]
  );

  useEffect(() => {
    return () => geo.dispose();
  }, [geo]);

  return (
    <mesh
      ref={ref}
      position={position}
      rotation-z={extraRotation}
      geometry={geo}
    >
      <meshBasicMaterial color={color} />
    </mesh>
  );
});
