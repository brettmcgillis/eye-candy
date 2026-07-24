import { useControls } from 'leva';
import * as THREE from 'three';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { TransformControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

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
  radius,
  defaultStrength,
  levaPrefix,
}) {
  const groupRef = useRef();
  const markerRef = useRef();
  const translateTCRef = useRef();
  const rotateTCRef = useRef();
  const scaleTCRef = useRef();
  const [ready, setReady] = useState(false);
  const { get } = useThree();

  const sphereRadius = markerSize;
  const coneRadius = markerSize * 0.3;
  const coneHeight = markerSize * 1.3;
  const coneOffset = markerSize * 1.85;

  // The group's scale encodes the per-attractor radius relative to the
  // default radius prop.  wireframe sphere geometry = `radius`, so
  // visual sphere size = radius × groupScale = effectiveRadius.
  const safeRadius = radius || 1;
  const effectiveRadius = attractor.radius ?? safeRadius;

  // Per-attractor Leva controls for strength & radius.
  const folderName = levaPrefix
    ? `${levaPrefix}.Attractor ${index + 1}`
    : `Attractor ${index + 1}`;
  const [levaValues, setLeva] = useControls(
    folderName,
    () => ({
      type: {
        label: 'Type',
        value: attractor.type || 'attractor',
        options: ['attractor', 'repeller'],
        render: () => true,
        onChange: (nextType) => {
          onUpdate(index, { type: nextType });
        },
      },
      strength: {
        label: 'Strength',
        value: attractor.strength ?? defaultStrength,
        min: 0,
        max: 5000,
        step: 50,
      },
      radius: {
        label: 'Radius',
        value: effectiveRadius,
        min: 1,
        max: 2000,
        step: 10,
      },
    }),
    { collapsed: true }
  );
  const levaRadiusRef = useRef(levaValues.radius);
  const levaStrengthRef = useRef(levaValues.strength);

  // Track previous uniform scale so we can detect which axis the user dragged.
  const prevUniformScale = useRef(effectiveRadius / safeRadius);

  // Place the group at world-space position, rotation, and radius-derived
  // scale (mount-only).
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...attractor.position);
    if (attractor.rotation) {
      groupRef.current.rotation.set(...attractor.rotation);
    }
    const relScale = effectiveRadius / safeRadius;
    groupRef.current.scale.set(relScale, relScale, relScale);
    // Keep marker at constant visual size despite group scale.
    if (markerRef.current) {
      const inv = 1 / relScale;
      markerRef.current.scale.set(inv, inv, inv);
    }
    setReady(true);
  }, []); // intentionally mount-only

  // Sync group scale when Leva radius changes.
  useEffect(() => {
    if (!groupRef.current || !ready) return;
    if (levaValues.radius === levaRadiusRef.current) return;
    levaRadiusRef.current = levaValues.radius;
    const relScale = Math.max(0.01, levaValues.radius / safeRadius);
    groupRef.current.scale.set(relScale, relScale, relScale);
    prevUniformScale.current = relScale;
    if (markerRef.current) {
      const inv = 1 / relScale;
      markerRef.current.scale.set(inv, inv, inv);
    }
    onUpdate(index, { radius: levaValues.radius });
  }, [levaValues.radius, ready, safeRadius, index, onUpdate]);

  // Sync strength when Leva strength changes.
  useEffect(() => {
    if (levaValues.strength === levaStrengthRef.current) return;
    levaStrengthRef.current = levaValues.strength;
    onUpdate(index, { strength: levaValues.strength });
  }, [levaValues.strength, index, onUpdate]);

  // Enforce uniform scale every frame — prevents visual stretching from
  // TransformControls per-axis handles.
  useFrame(() => {
    if (!groupRef.current) return;
    const s = groupRef.current.scale;
    if (s.x === s.y && s.y === s.z) return;
    const prev = prevUniformScale.current;
    const diffs = [
      Math.abs(s.x - prev),
      Math.abs(s.y - prev),
      Math.abs(s.z - prev),
    ];
    const maxIdx = diffs.indexOf(Math.max(...diffs));
    const uniform = Math.max(0.01, [s.x, s.y, s.z][maxIdx]);
    s.set(uniform, uniform, uniform);
    prevUniformScale.current = uniform;
    if (markerRef.current) {
      const inv = 1 / uniform;
      markerRef.current.scale.set(inv, inv, inv);
    }
  });

  // Wire TransformControls events → orbit toggle + attractor data callback.
  useEffect(() => {
    const refs = [
      translateTCRef.current,
      rotateTCRef.current,
      scaleTCRef.current,
    ].filter(Boolean);
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
      const s = groupRef.current.scale;

      // Enforce uniform scale: pick the axis that moved furthest from
      // the last known value, then apply it to all three axes.
      const prev = prevUniformScale.current;
      const diffs = [
        Math.abs(s.x - prev),
        Math.abs(s.y - prev),
        Math.abs(s.z - prev),
      ];
      const maxIdx = diffs.indexOf(Math.max(...diffs));
      const uniform = Math.max(0.01, [s.x, s.y, s.z][maxIdx]);
      s.set(uniform, uniform, uniform);
      prevUniformScale.current = uniform;

      const dir = new THREE.Vector3(0, 1, 0)
        .applyEuler(groupRef.current.rotation)
        .toArray();
      const rot = groupRef.current.rotation.toArray().slice(0, 3);
      // Keep marker meshes at constant visual size.
      if (markerRef.current) {
        const inv = 1 / uniform;
        markerRef.current.scale.set(inv, inv, inv);
      }
      const newRadius = safeRadius * uniform;
      levaRadiusRef.current = newRadius;
      setLeva({ radius: newRadius });
      onUpdate(index, {
        position: [p.x, p.y, p.z],
        direction: dir,
        rotation: rot,
        radius: newRadius,
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
  }, [ready, mode, index, onUpdate, get, safeRadius, setLeva]);

  const clr = ATTRACTOR_COLORS[index % ATTRACTOR_COLORS.length];

  const showTranslate = ready && (mode === 'translate' || mode === 'both');
  const showRotate = ready && (mode === 'rotate' || mode === 'both');
  const showScale = ready && mode === 'scale';

  return (
    <>
      <group ref={groupRef}>
        {/* Marker — inverse-scaled to stay constant size */}
        <group ref={markerRef}>
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

        {/* Radius visualization — wireframe sphere scaled by group */}
        <mesh visible={showScale}>
          <sphereGeometry args={[safeRadius, 32, 16]} />
          <meshBasicMaterial
            color={clr}
            wireframe
            transparent
            opacity={0.12}
            depthTest={false}
          />
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
      {showScale && (
        <TransformControls
          ref={scaleTCRef}
          object={groupRef.current}
          mode="scale"
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
 *        `{ position: [x,y,z], direction?: [x,y,z], rotation?: [x,y,z],
 *           radius?: number }`.
 * @param {string}  [props.mode='translate']  TransformControls mode —
 *        `'translate'`, `'rotate'`, `'scale'`, `'both'`, or `'none'`.
 * @param {boolean} [props.visible=true]       Hide all markers when false.
 * @param {number}  [props.radius=300]         Default attractor influence
 *        radius.  Per-attractor `radius` overrides this.
 * @param {number}  [props.markerSize=0.14]     Sphere radius of each marker
 *        (cone / offset scale proportionally). Sized for scene scale
 *        (1 unit ≈ 1 metre). Large-world consumers should pass a larger value.
 * @param {number}  [props.controlsSize=0.55]  TransformControls gizmo size.
 * @param {number}  [props.version=0]          Bump to force a full re-mount
 *        of handles (e.g. after add / remove).
 */
export default function Attractors({
  attractorsRef,
  mode = 'translate',
  visible = true,
  radius = 300,
  strength = 300,
  markerSize = 0.14,
  controlsSize = 0.55,
  version = 0,
  onUpdate: onUpdateProp,
  levaPrefix,
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
          radius={radius}
          defaultStrength={strength}
          levaPrefix={levaPrefix}
        />
      ))}
    </>
  );
}
