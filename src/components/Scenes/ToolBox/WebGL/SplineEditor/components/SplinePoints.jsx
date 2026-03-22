import * as THREE from 'three';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { OrbitControls, TransformControls } from '@react-three/drei';

const POINT_BOX_SIZE = 20;
const pointGeometry = new THREE.BoxGeometry(
  POINT_BOX_SIZE,
  POINT_BOX_SIZE,
  POINT_BOX_SIZE
);

export default function SplinePoints({ points, setPoints, visible = true }) {
  const orbitRef = useRef();
  const transformRef = useRef();
  const pointMeshRefs = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Deselect and detach transform controls whenever helpers are hidden.
  useEffect(() => {
    if (!visible) {
      setSelectedIndex(null);
      if (transformRef.current) transformRef.current.detach();
      if (orbitRef.current) orbitRef.current.enabled = true;
    }
  }, [visible]);

  // Keep refs array length in sync
  useEffect(() => {
    pointMeshRefs.current = pointMeshRefs.current.slice(0, points.length);
  }, [points.length]);

  // Attach / detach TransformControls when selection changes
  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;
    const mesh =
      selectedIndex !== null ? pointMeshRefs.current[selectedIndex] : null;
    if (mesh) {
      tc.attach(mesh);
    } else {
      tc.detach();
    }
  }, [selectedIndex]);

  // Wire dragging-changed directly on the TC Three.js object so orbit is
  // disabled the instant a TC handle drag begins — more reliable than the prop.
  useEffect(() => {
    const tc = transformRef.current;
    const orbit = orbitRef.current;
    if (!tc || !orbit) return;

    const onDrag = ({ value }) => {
      orbit.enabled = !value;
    };
    tc.addEventListener('dragging-changed', onDrag);
    // eslint-disable-next-line consistent-return
    return () => tc.removeEventListener('dragging-changed', onDrag);
  }); // no dep array — always re-binds with fresh refs after each render

  // Propagate TC drag position back into points state
  const handleObjectChange = useCallback(() => {
    const tc = transformRef.current;
    if (!tc || !tc.object || selectedIndex === null) return;
    const newPos = tc.object.position.clone();
    setPoints((prev) => {
      const next = [...prev];
      next[selectedIndex] = newPos;
      return next;
    });
  }, [selectedIndex, setPoints]);

  // Immediately disable orbit on pointerdown on a point mesh so that orbit
  // never starts on the same event that selects / starts a drag.
  const handlePointPointerDown = useCallback(() => {
    if (orbitRef.current) orbitRef.current.enabled = false;
  }, []);

  // Re-enable orbit on pointerup anywhere on the canvas
  const handlePointPointerUp = useCallback(() => {
    if (orbitRef.current) orbitRef.current.enabled = true;
  }, []);

  const handleSelect = useCallback((index) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handlePointerMissed = useCallback(() => {
    setSelectedIndex(null);
    if (orbitRef.current) orbitRef.current.enabled = true;
    if (transformRef.current) transformRef.current.detach();
  }, []);

  const addPoint = useCallback(() => {
    setPoints((prev) => {
      const last = prev[prev.length - 1] ?? new THREE.Vector3(0, 0, 0);
      return [
        ...prev,
        last
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 200,
              Math.random() * 100,
              (Math.random() - 0.5) * 200
            )
          ),
      ];
    });
  }, [setPoints]);

  // Keyboard shortcuts: A = add point, Delete/Backspace = remove selected
  useEffect(() => {
    const onKey = (e) => {
      if (e.target !== document.body) return;
      if (e.key === 'a' || e.key === 'A') {
        addPoint();
      }
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        selectedIndex !== null
      ) {
        setPoints((prev) => {
          if (prev.length <= 2) return prev;
          return prev.filter((_, i) => i !== selectedIndex);
        });
        setSelectedIndex(null);
        if (transformRef.current) transformRef.current.detach();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addPoint, selectedIndex, setPoints]);

  return (
    <>
      {/* eslint-disable react/no-array-index-key */}
      {visible &&
        points.map((pos, i) => (
          <mesh
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            ref={(el) => {
              pointMeshRefs.current[i] = el;
            }}
            geometry={pointGeometry}
            castShadow
            position={pos}
            onPointerDown={handlePointPointerDown}
            onPointerUp={handlePointPointerUp}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(i);
            }}
            onPointerMissed={handlePointerMissed}
          >
            <meshLambertMaterial
              color={new THREE.Color().setHSL((i * 0.13) % 1, 0.75, 0.55)}
              emissive={new THREE.Color().setHSL((i * 0.13) % 1, 0.75, 0.55)}
              emissiveIntensity={selectedIndex === i ? 0.6 : 0.0}
            />
          </mesh>
        ))}
      {/* eslint-enable react/no-array-index-key */}

      {visible && selectedIndex !== null && (
        <TransformControls
          ref={transformRef}
          onObjectChange={handleObjectChange}
        />
      )}

      {/* makeDefault registers OrbitControls with R3F so TransformControls
          can coordinate event priority with it automatically */}
      <OrbitControls ref={orbitRef} makeDefault dampingFactor={0.2} />
    </>
  );
}
