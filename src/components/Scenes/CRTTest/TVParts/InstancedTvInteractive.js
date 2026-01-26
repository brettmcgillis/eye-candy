/* eslint-disable no-param-reassign */
import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';

import { TvContext } from './TvInstances';

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

  /* ---------- unique dial materials ---------- */

  const dialMats = useMemo(
    () => ({
      power: nodes.dial_01.material.clone(),
      terminal: nodes.dial_02.material.clone(),
      vhs: nodes.dial_03.material.clone(),
      surf: nodes.dial_01.material.clone(),
      mute: nodes.dial_01.material.clone(),
    }),
    [nodes]
  );

  // set base emissive colors once
  useEffect(() => {
    dialMats.power.emissive.set('#ff1a1a');
    dialMats.terminal.emissive.set('#00ff55');
    dialMats.vhs.emissive.set('#1a4dff');
    dialMats.surf.emissive.set('#d0d0d0');
    dialMats.mute.emissive.set('#fb00ff');
  }, [dialMats]);

  /* ---------- glow springs ---------- */

  const powerGlow = useSpring({
    glow: power ? 1 : 0,
    config: { tension: 120, friction: 20 },
  });

  const terminalGlow = useSpring({
    glow: power && channelIndex === 3 ? 1 : 0,
    config: { tension: 120, friction: 20 },
  });

  const vhsGlow = useSpring({
    glow: power && channelIndex === 2 ? 1 : 0,
    config: { tension: 120, friction: 20 },
  });

  const surfGlow = useSpring({
    glow: power && channelSurfing ? 1 : 0,
    config: { tension: 120, friction: 20 },
  });

  const muteGlow = useSpring({
    glow: power && muted ? 1 : 0,
    config: { tension: 120, friction: 20 },
  });
  /* ---------- drive emissive every frame ---------- */

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

  /* ---------- render ---------- */

  return (
    <group {...props}>
      <group rotation={[-Math.PI, -Math.PI, -Math.PI]}>
        <merged.Body />

        {/* -------- DIALS -------- */}

        <primitive
          object={nodes.dial_01.clone()}
          ref={(r) => {
            if (!r) return;
            r.material = dialMats.power;
            dialRefs.current.dial1 = r;
          }}
          scale={0.5}
          position={[0.254, 0.208, 0.092]}
          onClick={(e) => {
            e.stopPropagation();
            pressDial('dial1');
            onDial1Click?.();
            setTimeout(() => releaseDial('dial1'), 120);
          }}
        />

        <primitive
          object={nodes.dial_02.clone()}
          ref={(r) => {
            if (!r) return;
            r.material = dialMats.terminal;
            dialRefs.current.dial2 = r;
          }}
          scale={0.5}
          position={[0.272, 0.208, 0.092]}
          onClick={(e) => {
            e.stopPropagation();
            pressDial('dial2');
            onDial2Click?.();
            setTimeout(() => releaseDial('dial2'), 120);
          }}
        />

        <primitive
          object={nodes.dial_03.clone()}
          ref={(r) => {
            if (!r) return;
            r.material = dialMats.vhs;
            dialRefs.current.dial3 = r;
          }}
          scale={0.5}
          position={[0.29, 0.208, 0.092]}
          onClick={(e) => {
            e.stopPropagation();
            pressDial('dial3');
            onDial3Click?.();
            setTimeout(() => releaseDial('dial3'), 120);
          }}
        />

        <primitive
          object={nodes.dial_01.clone()}
          ref={(r) => {
            if (!r) return;
            r.material = dialMats.surf;
            dialRefs.current.dial4 = r;
          }}
          scale={0.5}
          position={[0.308, 0.208, 0.092]} // 👈 tweak this
          onClick={(e) => {
            e.stopPropagation();
            pressDial('dial4');
            onDial4Click?.();
            setTimeout(() => releaseDial('dial4'), 120);
          }}
        />

        <primitive
          object={nodes.dial_01.clone()}
          ref={(r) => {
            if (!r) return;
            r.material = dialMats.mute;
            dialRefs.current.dial5 = r;
          }}
          scale={0.5}
          position={[0.326, 0.208, 0.092]} // 👈 tweak this
          onClick={(e) => {
            e.stopPropagation();
            pressDial('dial5');
            onDial5Click?.();
            setTimeout(() => releaseDial('dial5'), 120);
          }}
        />
        {/* -------- KNOBS -------- */}

        <animated.group
          position={[0.291, 0.406, 0.097]}
          rotation-z={knobRotation}
        >
          <merged.Knob onClick={onKnob01Click} />
        </animated.group>

        <merged.Knob1
          position={[0.291, 0.289, 0.097]}
          onClick={onKnob02Click}
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
