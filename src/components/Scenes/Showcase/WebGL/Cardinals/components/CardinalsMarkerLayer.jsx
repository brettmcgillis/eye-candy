/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, { forwardRef, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { squareWorldSize, uvToWorld } from '../utils/markerUtils';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

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
 * Axis-aligned outlined square. Accepts a ref to the underlying LineSegments
 * for imperative position updates in useFrame.
 */
const OutlineSquare = forwardRef(function OutlineSquare(
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

  return <primitive ref={ref} object={obj} position={position} />;
});

// ---------------------------------------------------------------------------
// Moving auto-pointer square — updates position each frame from the ref
// ---------------------------------------------------------------------------

function AutoPointerSquare({ index, autoPointersRef, viewport, size, color }) {
  const objRef = useRef();

  useFrame(() => {
    const ap = autoPointersRef.current?.[index];
    if (ap && objRef.current) {
      const [x, y] = uvToWorld(ap.x, ap.y, viewport);
      objRef.current.position.set(x, y, 0.11);
    }
  });

  const initPos = useMemo(() => {
    const start = autoPointersRef.current?.[index];
    return uvToWorld(start?.x ?? 0.5, start?.y ?? 0.5, viewport);
  }, []);

  return (
    <OutlineSquare ref={objRef} position={initPos} size={size} color={color} />
  );
}

// ---------------------------------------------------------------------------
// Cursor square — tracks the pointer ref each frame
// ---------------------------------------------------------------------------

function CursorSquare({ pointerRef, viewport, size, color }) {
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

  return (
    <OutlineSquare
      ref={objRef}
      position={[0, 0, 0.12]}
      size={size}
      color={color}
    />
  );
}

// ---------------------------------------------------------------------------
// Layer
// ---------------------------------------------------------------------------

/**
 * Renders all Cardinals markers as scene geometry:
 *   - Static outlined squares at the 4 corner auto-splat start positions
 *   - Moving outlined squares tracking the current auto-pointer positions
 *   - A cursor square that follows the mouse pointer
 */
export default function CardinalsMarkerLayer({
  fluidConfig,
  viewport,
  autoPointersRef,
  pointerRef,
}) {
  const autoSize = squareWorldSize(fluidConfig.debugAutoWidth, viewport);
  const pointerSize = squareWorldSize(fluidConfig.debugPointerWidth, viewport);
  const autoColor = fluidConfig.debugAutoColor;
  const pointerColor = fluidConfig.debugPointerColor;
  const starts = fluidConfig.autoSplatStarts ?? [];

  return (
    <>
      {/* Moving markers tracking each auto-pointer's current position */}
      {starts.map((_, i) => (
        <AutoPointerSquare
          key={`auto-${i}`}
          index={i}
          autoPointersRef={autoPointersRef}
          viewport={viewport}
          size={autoSize}
          color={autoColor}
        />
      ))}

      {/* Cursor indicator */}
      <CursorSquare
        pointerRef={pointerRef}
        viewport={viewport}
        size={pointerSize}
        color={pointerColor}
      />
    </>
  );
}
