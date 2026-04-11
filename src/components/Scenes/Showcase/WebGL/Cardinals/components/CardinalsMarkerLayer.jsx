/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, { forwardRef, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { squareWorldSize, uvToWorld } from '../utils/markerUtils';

const DEG_TO_RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------

/**
 * Builds an axis-aligned square ring ShapeGeometry (outer square minus inner
 * square hole). `size` is the outer side length; `lineThickness` is the border
 * width in the same world units.
 */
function makeSquareRingGeometry(size, lineThickness) {
  const h = size / 2;
  const innerH = Math.max(0, h - lineThickness);

  const shape = new THREE.Shape();
  shape.moveTo(-h, -h);
  shape.lineTo(h, -h);
  shape.lineTo(h, h);
  shape.lineTo(-h, h);
  shape.closePath();

  if (innerH > 0) {
    const hole = new THREE.Path();
    hole.moveTo(-innerH, -innerH);
    hole.lineTo(innerH, -innerH);
    hole.lineTo(innerH, innerH);
    hole.lineTo(-innerH, innerH);
    hole.closePath();
    shape.holes.push(hole);
  }

  return new THREE.ShapeGeometry(shape);
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Axis-aligned filled square.
 */
const FilledSquare = forwardRef(function FilledSquare(
  { position, size, color, extraRotation = 0 },
  ref
) {
  return (
    <mesh ref={ref} position={position} rotation-z={extraRotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
});

/**
 * Axis-aligned outlined square rendered as a mesh ring (outer minus inner
 * square). Uses ShapeGeometry so lineThickness is a real world-unit value,
 * not a WebGL linewidth (which is capped at 1 px on most GPUs).
 */
const OutlinedSquare = forwardRef(function OutlinedSquare(
  { position, size, color, lineThickness, extraRotation = 0 },
  ref
) {
  const thickness = lineThickness ?? size * 0.15;

  const geo = useMemo(
    () => makeSquareRingGeometry(size, thickness),
    [size, thickness]
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

// ---------------------------------------------------------------------------
// Moving auto-pointer square — updates position each frame from the ref
// ---------------------------------------------------------------------------

function AutoPointerSquare({
  index,
  autoPointersRef,
  viewport,
  size,
  color,
  fill,
  lineThickness,
  rotation,
}) {
  const objRef = useRef();

  useFrame(() => {
    const ap = autoPointersRef.current?.[index];
    if (ap && objRef.current) {
      const [x, y] = uvToWorld(ap.x, ap.y, viewport);
      // Offset z-depth slightly to prevent z-fighting between fill/outline
      const zDepth = fill ? 0.111 : 0.112;
      objRef.current.position.set(x, y, zDepth);
    }
  });

  const initPos = useMemo(() => {
    const start = autoPointersRef.current?.[index];
    return uvToWorld(start?.x ?? 0.5, start?.y ?? 0.5, viewport);
  }, []);

  if (fill) {
    return (
      <FilledSquare
        ref={objRef}
        position={initPos}
        size={size}
        color={color}
        extraRotation={rotation}
      />
    );
  }
  return (
    <OutlinedSquare
      ref={objRef}
      position={initPos}
      size={size}
      color={color}
      lineThickness={lineThickness}
      extraRotation={rotation}
    />
  );
}

// ---------------------------------------------------------------------------
// Cursor square — tracks the pointer ref each frame
// ---------------------------------------------------------------------------

function CursorSquare({
  pointerRef,
  viewport,
  size,
  color,
  fill,
  lineThickness,
  rotation,
}) {
  const objRef = useRef();

  useFrame(() => {
    const ptr = pointerRef.current;
    if (!objRef.current) return;
    if (ptr) {
      const [x, y] = uvToWorld(ptr.x, ptr.y, viewport);
      objRef.current.position.set(x, y, 0.12);
      objRef.current.visible = true;
    } else {
      objRef.current.visible = false;
    }
  });
  if (fill) {
    return (
      <FilledSquare
        ref={objRef}
        position={[0, 0, 0.121]}
        size={size}
        color={color}
        extraRotation={rotation}
      />
    );
  }
  return (
    <OutlinedSquare
      ref={objRef}
      position={[0, 0, 0.122]}
      size={size}
      color={color}
      lineThickness={lineThickness}
      extraRotation={rotation}
    />
  );
}

// ---------------------------------------------------------------------------
// Layer
// ---------------------------------------------------------------------------

/**
 * Renders all Cardinals markers as scene geometry:
 *   - Moving outlined/filled squares tracking each auto-pointer's position
 *   - A cursor square that follows the mouse/hand pointer
 *
 * All debug visual controls (fill, rotation, line weight, color) from
 * fluidConfig are wired through to the geometry primitives.
 */
export default function CardinalsMarkerLayer({
  fluidConfig,
  viewport,
  autoPointersRef,
  pointerRef,
}) {
  // — Auto-pointer marker controls —
  const autoSize = squareWorldSize(fluidConfig.debugAutoWidth, viewport);
  // Line weight is a percentage of marker size, not viewport size.
  const autoLineThickness =
    autoSize * ((fluidConfig.debugAutoLineWeight ?? 2) / 100);
  const autoFill = !!fluidConfig.debugAutoFill;
  const autoRotation = (fluidConfig.debugAutoRotation ?? 0) * DEG_TO_RAD;
  const autoColor = fluidConfig.debugAutoColor;
  const autoVisible = !!fluidConfig.debugAutoSplat;

  // — Cursor marker controls —
  const pointerSize = squareWorldSize(fluidConfig.debugPointerWidth, viewport);
  // Line weight is a percentage of marker size, not viewport size.
  const pointerLineThickness =
    pointerSize * ((fluidConfig.debugPointerLineWeight ?? 2) / 100);
  const pointerFill = !!fluidConfig.debugPointerFill;
  const pointerRotation = (fluidConfig.debugPointerRotation ?? 0) * DEG_TO_RAD;
  const pointerColor = fluidConfig.debugPointerColor;
  const pointerVisible = !!fluidConfig.debugCursor;

  const starts = fluidConfig.autoSplatStarts ?? [];

  return (
    <>
      {autoVisible &&
        starts.map((_, i) => (
          <AutoPointerSquare
            key={`auto-${i}`}
            index={i}
            autoPointersRef={autoPointersRef}
            viewport={viewport}
            size={autoSize}
            color={autoColor}
            fill={autoFill}
            lineThickness={autoLineThickness}
            rotation={autoRotation}
          />
        ))}

      {pointerVisible && (
        <CursorSquare
          pointerRef={pointerRef}
          viewport={viewport}
          size={pointerSize}
          color={pointerColor}
          fill={pointerFill}
          lineThickness={pointerLineThickness}
          rotation={pointerRotation}
        />
      )}
    </>
  );
}
