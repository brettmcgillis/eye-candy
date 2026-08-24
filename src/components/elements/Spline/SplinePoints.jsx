import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { TransformControls } from '@react-three/drei';
import { createPortal, useThree } from '@react-three/fiber';

import * as THREE from 'three';

// Default sized for scene scale (1 unit ≈ 1 metre).
// Large-world consumers (e.g. SplineEditor) should pass an explicit pointSize.
const DEFAULT_POINT_SIZE = 0.2;

export default function SplinePoints({
  points,
  setPoints,
  visible = true,
  mode = 'translate',
  pointSize = DEFAULT_POINT_SIZE,
}) {
  const pointGeometry = useMemo(
    () => new THREE.BoxGeometry(pointSize, pointSize, pointSize),
    [pointSize]
  );
  const controls = useThree((state) => state.controls);
  const scene = useThree((state) => state.scene);
  const transformRef = useRef();
  const pointMeshRefs = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Deselect and detach transform controls whenever helpers are hidden.
  useEffect(() => {
    if (!visible) {
      setSelectedIndex(null);
      if (transformRef.current) transformRef.current.detach();
      if (controls) controls.enabled = true;
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
    if (!tc || !controls) return;

    const onDrag = ({ value }) => {
      controls.enabled = !value;
    };
    tc.addEventListener('dragging-changed', onDrag);
    // eslint-disable-next-line consistent-return
    return () => tc.removeEventListener('dragging-changed', onDrag);
  }); // no dep array — always re-binds with fresh refs after each render

  // Propagate TC drag back into point data
  const handleObjectChange = useCallback(() => {
    const tc = transformRef.current;
    if (!tc || !tc.object || selectedIndex === null) return;
    if (mode === 'rotate') {
      const rot = tc.object.rotation.clone();
      setPoints((prev) => {
        const next = [...prev];
        next[selectedIndex] = { ...next[selectedIndex], rotation: rot };
        return next;
      });
    } else if (mode === 'scale') {
      const newScale = tc.object.scale.clone();
      setPoints((prev) => {
        const next = [...prev];
        next[selectedIndex] = { ...next[selectedIndex], scale: newScale };
        return next;
      });
    } else {
      const newPos = tc.object.position.clone();
      setPoints((prev) => {
        const next = [...prev];
        next[selectedIndex] = { ...next[selectedIndex], position: newPos };
        return next;
      });
    }
  }, [selectedIndex, setPoints, mode]);

  // Immediately disable orbit on pointerdown on a point mesh so that orbit
  // never starts on the same event that selects / starts a drag.
  const handlePointPointerDown = useCallback(
    (event) => {
      event.stopPropagation();
      if (controls) controls.enabled = false;
    },
    [controls]
  );

  // Re-enable orbit on pointerup anywhere on the canvas
  const handlePointPointerUp = useCallback(
    (event) => {
      event.stopPropagation();
      if (controls) controls.enabled = true;
    },
    [controls]
  );

  const handleSelect = useCallback((index) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handlePointerMissed = useCallback(() => {
    setSelectedIndex(null);
    if (controls) controls.enabled = true;
    if (transformRef.current) transformRef.current.detach();
  }, [controls]);

  const addPoint = useCallback(() => {
    setPoints((prev) => {
      const last = prev[prev.length - 1];
      const lastPos = last?.position ?? new THREE.Vector3(0, 0, 0);
      return [
        ...prev,
        {
          position: lastPos
            .clone()
            .add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
              )
            ),
          rotation: new THREE.Euler(),
          scale: new THREE.Vector3(1, 1, 1),
        },
      ];
    });
  }, [setPoints]);

  // Keyboard shortcuts: A = add point, Delete/Backspace = remove selected
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

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
  }, [addPoint, selectedIndex, setPoints, visible]);

  return (
    <>
      {/* eslint-disable react/no-array-index-key */}
      {visible &&
        points.map((pt, i) => (
          <mesh
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            ref={(el) => {
              pointMeshRefs.current[i] = el;
            }}
            geometry={pointGeometry}
            castShadow
            position={pt.position}
            rotation={pt.rotation ?? new THREE.Euler()}
            scale={pt.scale ?? [1, 1, 1]}
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

      {visible &&
        selectedIndex !== null &&
        createPortal(
          <TransformControls
            ref={transformRef}
            mode={mode}
            onObjectChange={handleObjectChange}
          />,
          scene
        )}
    </>
  );
}
