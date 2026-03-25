import * as THREE from 'three';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const ATTRACTOR_COLORS = [
  '#ff4466',
  '#44ff66',
  '#4488ff',
  '#ffdd44',
  '#ff44ff',
  '#44ffff',
  '#ff8844',
  '#88ff44',
];

// ---------------------------------------------------------------------------
// Single draggable attractor marker
// ---------------------------------------------------------------------------

function AttractorHandle({
  index,
  attractor,
  mode,
  onUpdate,
  markerSize,
  controlsSize,
}) {
  const groupRef = useRef();
  const translateTCRef = useRef();
  const rotateTCRef = useRef();
  const [ready, setReady] = useState(false);
  const { get } = useThree();

  const sphereRadius = markerSize;
  const coneRadius = markerSize * 0.3;
  const coneHeight = markerSize * 1.3;
  const coneOffset = markerSize * 1.85;

  // Place the group at world-space position and apply stored rotation (mount-only).
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...attractor.position);
    if (attractor.rotation) {
      groupRef.current.rotation.set(...attractor.rotation);
    }
    setReady(true);
  }, []); // intentionally mount-only

  // Wire TransformControls events → orbit toggle + attractor data callback.
  useEffect(() => {
    const refs = [translateTCRef.current, rotateTCRef.current].filter(Boolean);
    if (refs.length === 0 || !ready) return undefined;

    const onDrag = (event) => {
      const orbit = get().controls;
      if (orbit) {
        orbit.enabled = !event.value;
      }
    };

    const onChange = () => {
      if (!groupRef.current) return;
      const p = groupRef.current.position;
      const dir = new THREE.Vector3(0, 1, 0)
        .applyEuler(groupRef.current.rotation)
        .toArray();
      const rot = groupRef.current.rotation.toArray().slice(0, 3);
      onUpdate(index, {
        position: [p.x, p.y, p.z],
        direction: dir,
        rotation: rot,
      });
    };

    refs.forEach((tc) => {
      tc.addEventListener('dragging-changed', onDrag);
      tc.addEventListener('objectChange', onChange);
    });
    return () => {
      refs.forEach((tc) => {
        tc.removeEventListener('dragging-changed', onDrag);
        tc.removeEventListener('objectChange', onChange);
      });
    };
  }, [ready, mode, index, onUpdate, get]);

  const clr = ATTRACTOR_COLORS[index % ATTRACTOR_COLORS.length];

  const showTranslate = ready && (mode === 'translate' || mode === 'both');
  const showRotate = ready && (mode === 'rotate' || mode === 'both');

  return (
    <>
      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[sphereRadius, 2]} />
          <meshBasicMaterial
            color={clr}
            transparent
            opacity={0.75}
            depthTest={false}
          />
        </mesh>
        <mesh position={[0, coneOffset, 0]}>
          <coneGeometry args={[coneRadius, coneHeight, 8]} />
          <meshBasicMaterial color={clr} depthTest={false} />
        </mesh>
      </group>

      {showTranslate && (
        <TransformControls
          ref={translateTCRef}
          object={groupRef.current}
          mode="translate"
          size={controlsSize}
        />
      )}
      {showRotate && (
        <TransformControls
          ref={rotateTCRef}
          object={groupRef.current}
          mode="rotate"
          size={controlsSize}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Attractor list — renders all handles
// ---------------------------------------------------------------------------

/**
 * Generic attractor overlay for particle systems.
 *
 * @param {Object}  props
 * @param {React.MutableRefObject<Array>} props.attractorsRef  Mutable ref
 *        whose `.current` is the array of attractor objects:
 *        `{ position: [x,y,z], direction?: [x,y,z], rotation?: [x,y,z] }`.
 * @param {string}  [props.mode='translate']  TransformControls mode —
 *        `'translate'`, `'rotate'`, `'both'`, or `'none'`.
 * @param {boolean} [props.visible=true]       Hide all markers when false.
 * @param {number}  [props.markerSize=14]      Sphere radius of each marker
 *        (cone / offset scale proportionally).
 * @param {number}  [props.controlsSize=0.55]  TransformControls gizmo size.
 * @param {number}  [props.version=0]          Bump to force a full re-mount
 *        of handles (e.g. after add / remove).
 */
export default function Attractors({
  attractorsRef,
  mode = 'translate',
  visible = true,
  markerSize = 14,
  controlsSize = 0.55,
  version = 0,
  onUpdate: onUpdateProp,
}) {
  const defaultUpdate = useCallback(
    (idx, data) => {
      // eslint-disable-next-line no-param-reassign
      attractorsRef.current[idx] = {
        ...attractorsRef.current[idx],
        ...data,
      };
    },
    [attractorsRef]
  );

  const handleUpdate = onUpdateProp || defaultUpdate;

  if (!visible) return null;

  return (
    <>
      {attractorsRef.current.map((attr, i) => (
        <AttractorHandle
          // eslint-disable-next-line react/no-array-index-key
          key={`${i}-${version}`}
          index={i}
          attractor={attr}
          mode={mode}
          onUpdate={handleUpdate}
          markerSize={markerSize}
          controlsSize={controlsSize}
        />
      ))}
    </>
  );
}
