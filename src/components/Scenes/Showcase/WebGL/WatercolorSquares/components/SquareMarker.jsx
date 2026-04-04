import * as THREE from 'three';

import React, { forwardRef, useEffect, useMemo } from 'react';

const ROTATION_45 = Math.PI / 4;

/**
 * Builds a diamond ring ShapeGeometry (outer diamond minus inner diamond hole).
 * `size` is the PlaneGeometry-equivalent side length — tip-to-tip = size * √2.
 * `lineThickness` is the border width in the same world units.
 */
function makeDiamondRingGeometry(size, lineThickness) {
  const outerR = (size * Math.SQRT2) / 2;
  const innerR = Math.max(0, outerR - lineThickness);

  const shape = new THREE.Shape();
  shape.moveTo(outerR, 0);
  shape.lineTo(0, outerR);
  shape.lineTo(-outerR, 0);
  shape.lineTo(0, -outerR);
  shape.closePath();

  if (innerR > 0) {
    const hole = new THREE.Path();
    hole.moveTo(innerR, 0);
    hole.lineTo(0, innerR);
    hole.lineTo(-innerR, 0);
    hole.lineTo(0, -innerR);
    hole.closePath();
    shape.holes.push(hole);
  }

  return new THREE.ShapeGeometry(shape);
}

/**
 * A single filled square (PlaneGeometry) rendered as a diamond (rotated 45°).
 * extraRotation is an optional additional z-rotation in radians.
 */
export function FilledSquare({ position, size, color, extraRotation = 0 }) {
  return (
    <mesh position={position} rotation-z={ROTATION_45 + extraRotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/**
 * A single outlined diamond rendered as a mesh ring (outer minus inner diamond).
 * Uses ShapeGeometry so lineThickness is a real world-unit value, not a WebGL
 * linewidth (which is capped at 1px on most GPUs).
 */
export const OutlinedSquare = forwardRef(function OutlinedSquare(
  { position, size, color, lineThickness, extraRotation = 0 },
  ref
) {
  const thickness = lineThickness ?? size * 0.15;

  const geo = useMemo(
    () => makeDiamondRingGeometry(size, thickness),
    [size, thickness]
  );

  useEffect(() => {
    return () => geo.dispose();
  }, [geo]);

  return (
    <mesh ref={ref} position={position} rotation-z={extraRotation} geometry={geo}>
      <meshBasicMaterial color={color} />
    </mesh>
  );
});
