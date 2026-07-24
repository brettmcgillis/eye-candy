/* eslint-disable no-param-reassign */
import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';

import { TvContext } from './TvInstances';

/* ---------- helpers ---------- */

function extractMesh(node) {
  let found = null;
  node.traverse((o) => {
    if (o.isMesh && !found) found = o;
  });
  return found;
}

export default function InstancedTvInteractive({
  knob01Step = 0,
  stepsPerRotation = 12,

  onDial1Click,
  onDial2Click,
  onDial3Click,
  onDial4Click,
  onDial5Click,

  onKnob01Click,
  onKnob02Click,

  screenMaterial,
  power,
  muted,
  channelSurfing,
  channelIndex,
  ...props
}) {
  const { merged, nodes, screenGeo } = useContext(TvContext);
  const dialRefs = useRef({});

  /* ---------- knob rotation ---------- */

  const stepAngle = (Math.PI * 2) / stepsPerRotation;

  const { knobRotation } = useSpring({
    knobRotation: -(knob01Step * stepAngle),
    config: { tension: 180, friction: 20 },
  });

  /* ---------- extract dial geometries once ---------- */

  const dialGeos = useMemo(() => {
    return {
      d1: extractMesh(nodes.dial_01)?.geometry,
      d2: extractMesh(nodes.dial_02)?.geometry,
      d3: extractMesh(nodes.dial_03)?.geometry,
    };
  }, [nodes]);

  /* ---------- unique dial materials ---------- */

  const dialMats = useMemo(
    () => ({
      power: extractMesh(nodes.dial_01).material.clone(),
      terminal: extractMesh(nodes.dial_02).material.clone(),
      vhs: extractMesh(nodes.dial_03).material.clone(),
      surf: extractMesh(nodes.dial_01).material.clone(),
      mute: extractMesh(nodes.dial_01).material.clone(),
    }),
    [nodes]
  );

  /* ---------- emissive base colors ---------- */

  useEffect(() => {
    dialMats.power.emissive.set('#ff1a1a');
    dialMats.terminal.emissive.set('#00ff55');
    dialMats.vhs.emissive.set('#1a4dff');
    dialMats.surf.emissive.set('#d0d0d0');
    dialMats.mute.emissive.set('#fb00ff');
  }, [dialMats]);

  /* ---------- glow springs ---------- */

  const powerGlow = useSpring({ glow: power ? 1 : 0 });
  const terminalGlow = useSpring({ glow: power && channelIndex === 3 ? 1 : 0 });
  const vhsGlow = useSpring({ glow: power && channelIndex === 2 ? 1 : 0 });
  const surfGlow = useSpring({ glow: power && channelSurfing ? 1 : 0 });
  const muteGlow = useSpring({ glow: power && muted ? 1 : 0 });

  /* ---------- drive emissive ---------- */

  useFrame(() => {
    dialMats.power.emissiveIntensity = powerGlow.glow.get() * 2;
    dialMats.terminal.emissiveIntensity = terminalGlow.glow.get() * 2;
    dialMats.vhs.emissiveIntensity = vhsGlow.glow.get() * 2;
    dialMats.surf.emissiveIntensity = surfGlow.glow.get() * 2;
    dialMats.mute.emissiveIntensity = muteGlow.glow.get() * 2;
  });

  /* ---------- press animation ---------- */

  function pressDial(id, depth = 0.004) {
    const d = dialRefs.current[id];
    if (d) d.position.z += depth;
  }

  function releaseDial(id, depth = 0.004) {
    const d = dialRefs.current[id];
    if (d) d.position.z -= depth;
  }

  function dialHandler(id, cb) {
    return (e) => {
      e.stopPropagation();
      pressDial(id);
      cb?.();
      setTimeout(() => releaseDial(id), 120);
    };
  }

  /* ---------- render ---------- */

  return (
    <group {...props}>
      <group rotation={[-Math.PI, -Math.PI, -Math.PI]}>
        <merged.Body />

        {/* -------- DIALS (real meshes, raycast-safe) -------- */}

        <mesh
          geometry={dialGeos.d1}
          material={dialMats.power}
          scale={0.5}
          position={[0.254, 0.208, 0.092]}
          ref={(r) => {
            dialRefs.current.dial1 = r;
          }}
          onPointerDown={dialHandler('dial1', onDial1Click)}
        />

        <mesh
          geometry={dialGeos.d2}
          material={dialMats.terminal}
          scale={0.5}
          position={[0.272, 0.208, 0.092]}
          ref={(r) => {
            dialRefs.current.dial2 = r;
          }}
          onPointerDown={dialHandler('dial2', onDial2Click)}
        />

        <mesh
          geometry={dialGeos.d3}
          material={dialMats.vhs}
          scale={0.5}
          position={[0.29, 0.208, 0.092]}
          ref={(r) => {
            dialRefs.current.dial3 = r;
          }}
          onPointerDown={dialHandler('dial3', onDial3Click)}
        />

        <mesh
          geometry={dialGeos.d1}
          material={dialMats.surf}
          scale={0.5}
          position={[0.308, 0.208, 0.092]}
          ref={(r) => {
            dialRefs.current.dial4 = r;
          }}
          onPointerDown={dialHandler('dial4', onDial4Click)}
        />

        <mesh
          geometry={dialGeos.d1}
          material={dialMats.mute}
          scale={0.5}
          position={[0.326, 0.208, 0.092]}
          ref={(r) => {
            dialRefs.current.dial5 = r;
          }}
          onPointerDown={dialHandler('dial5', onDial5Click)}
        />

        {/* -------- KNOBS -------- */}

        <animated.group
          position={[0.291, 0.406, 0.097]}
          rotation-z={knobRotation}
        >
          <merged.Knob onPointerDown={onKnob01Click} />
        </animated.group>

        <merged.Knob1
          position={[0.291, 0.289, 0.097]}
          onPointerDown={onKnob02Click}
        />

        {/* -------- SCREEN -------- */}

        <mesh
          geometry={screenGeo}
          position={[-0.077, 0.262, 0.07]}
          rotation={[0, 0, -3.13]}
        >
          {screenMaterial ?? (
            <meshStandardMaterial color="#111" metalness={1} roughness={0} />
          )}
        </mesh>
      </group>
    </group>
  );
}
