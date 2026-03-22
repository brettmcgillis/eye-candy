import { button, useControls } from 'leva';
import * as THREE from 'three';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const MAX_ATTRACTORS = 8;

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

// Marker size scaled to the SplineEditor world space (~2000 units).
const SPHERE_RADIUS = 14;
const CONE_RADIUS = 4;
const CONE_HEIGHT = 18;
const CONE_OFFSET = 26;

// ---------------------------------------------------------------------------
// Single draggable attractor marker
// ---------------------------------------------------------------------------

function AttractorHandle({ index, attractor, mode, onUpdate }) {
  const groupRef = useRef();
  const tcRef = useRef();
  const [ready, setReady] = useState(false);
  const { get } = useThree();

  // Place the group at the world-space position and apply stored rotation (mount-only).
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...attractor.position);
    if (attractor.rotation) {
      groupRef.current.rotation.set(...attractor.rotation);
    }
    setReady(true);
  }, []); // intentionally mount-only

  // Wire TC events to disable orbit and report position updates.
  useEffect(() => {
    const tc = tcRef.current;
    if (!tc || !ready) return undefined;

    const onDrag = (event) => {
      const orbit = get().controls;
      if (orbit) orbit.enabled = !event.value;
    };

    const onChange = () => {
      if (!groupRef.current) return;
      const p = groupRef.current.position;
      // Compute the world-space direction of the attractor (local +Y after rotation).
      // Used by the particle sim for the directional force component.
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

    tc.addEventListener('dragging-changed', onDrag);
    tc.addEventListener('objectChange', onChange);
    return () => {
      tc.removeEventListener('dragging-changed', onDrag);
      tc.removeEventListener('objectChange', onChange);
    };
  }, [ready, mode, index, onUpdate, get]);

  const clr = ATTRACTOR_COLORS[index % ATTRACTOR_COLORS.length];

  return (
    <>
      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[SPHERE_RADIUS, 2]} />
          <meshBasicMaterial
            color={clr}
            transparent
            opacity={0.75}
            depthTest={false}
          />
        </mesh>
        {/* upward cone — visual marker showing "attractor" */}
        <mesh position={[0, CONE_OFFSET, 0]}>
          <coneGeometry args={[CONE_RADIUS, CONE_HEIGHT, 8]} />
          <meshBasicMaterial color={clr} depthTest={false} />
        </mesh>
      </group>

      {ready && mode !== 'none' && (
        <TransformControls
          ref={tcRef}
          object={groupRef.current}
          mode={mode}
          size={0.55}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Manager — Leva panel + attractor list
// ---------------------------------------------------------------------------

export default function SmokeAttractors({ attractorsRef }) {
  const [, forceUpdate] = useState(0);

  const { showHelpers, controlsMode } = useControls('Attractors', {
    showHelpers: { label: 'Show Helpers', value: true },
    controlsMode: {
      label: 'Mode',
      value: 'translate',
      options: ['translate', 'rotate', 'none'],
    },
    addAttractor: button(() => {
      if (attractorsRef.current.length >= MAX_ATTRACTORS) return;
      attractorsRef.current.push({
        position: [
          (Math.random() - 0.5) * 600,
          100 + Math.random() * 500,
          (Math.random() - 0.5) * 400,
        ],
        direction: [0, 1, 0],
        rotation: [0, 0, 0],
      });
      forceUpdate((c) => c + 1);
    }),
    removeAttractor: button(() => {
      if (attractorsRef.current.length <= 1) return;
      attractorsRef.current.pop();
      forceUpdate((c) => c + 1);
    }),
  });

  const handleUpdate = useCallback(
    (idx, { position, direction, rotation }) => {
      // eslint-disable-next-line no-param-reassign
      attractorsRef.current[idx] = { position, direction, rotation };
    },
    [attractorsRef]
  );

  if (!showHelpers) return null;

  return (
    <>
      {attractorsRef.current.map((attr, i) => (
        <AttractorHandle
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          index={i}
          attractor={attr}
          mode={controlsMode}
          onUpdate={handleUpdate}
        />
      ))}
    </>
  );
}
