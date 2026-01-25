/* eslint-disable no-param-reassign */

/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */

/* eslint-disable react/jsx-no-bind */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';

import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from 'components/scenes/CRTTest/CRTBlueScreenMaterial';
import CRTSceneInSceneMaterial from 'components/scenes/CRTTest/CRTSceneInSceneMaterial';
import CRTSceneMaterial from 'components/scenes/CRTTest/CRTSceneMaterial';
import CRTShowMaterial from 'components/scenes/CRTTest/CRTShowMaterial';
import CRTSnowMaterial from 'components/scenes/CRTTest/CRTSnowMaterial';
import CRTStaticMaterial from 'components/scenes/CRTTest/CRTStaticMaterial';
import TestScene from 'components/scenes/CRTTest/TestScene';

/* ---------------------------------------------
   Parent / Orchestrator
---------------------------------------------- */
import { TvContext, TvInstances } from './TvInstances';

export function InteractiveTvController({
  stepsPerRotation = 12,
  isTurnedOn = true,
  ...props
}) {
  /* ---------- shared tv materials ---------- */

  const materials = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({
        color: '#050505',
        roughness: 0.65,
        metalness: 0.15,
      }),
      plastic: new THREE.MeshStandardMaterial({
        color: '#0b0b0b',
        roughness: 0.4,
        metalness: 0.1,
      }),
    }),
    []
  );

  /* ---------- channels ---------- */

  const channels = useMemo(
    () => [
      <CRTSnowMaterial key="snow" />,
      <CRTStaticMaterial key="static" />,
      <CRTBlueScreenMaterial key="vhs" {...VHSSetting} />, // index 2
      <CRTBlueScreenMaterial key="terminal" {...TerminalSetting} />, // index 3
      <CRTShowMaterial key="homeVideo" useWebcam />,
      <CRTShowMaterial key="tv" />,
      <CRTSceneMaterial key="threeD" scene={<TestScene />} />,
      <CRTSceneInSceneMaterial key="pip" />,
    ],
    []
  );

  /* ---------- tv state ---------- */

  const [power, setPower] = useState(isTurnedOn);

  const [channelIndex, setChannelIndex] = useState(0);
  const [knobStep, setKnobStep] = useState(0);

  const activeChannel = power ? channels[channelIndex % channels.length] : null;

  /* ---------- handlers ---------- */

  function handleKnob01Click() {
    setKnobStep((s) => s + 1);
    setChannelIndex((i) => (i + 1) % channels.length);
  }

  function handleDial1Click() {
    setPower((p) => !p);
  }

  function handleDial2Click() {
    setPower(true);
    setChannelIndex(3); // terminal
  }

  function handleDial3Click() {
    setPower(true);
    setChannelIndex(2); // vhs
  }

  function handleKnob02Click() {
    console.log('knob 2 clicked (reserved)');
  }

  /* ---------- render ---------- */

  return (
    <TvInstances
      bodyMaterial={materials.body}
      dialMaterial={materials.plastic}
      knobMaterial={materials.plastic}
    >
      <InstancedTvInteractive
        {...props}
        stepsPerRotation={stepsPerRotation}
        knob01Step={knobStep}
        power={power}
        channelIndex={channelIndex}
        screenMaterial={activeChannel}
        onDial1Click={handleDial1Click}
        onDial2Click={handleDial2Click}
        onDial3Click={handleDial3Click}
        onKnob01Click={handleKnob01Click}
        onKnob02Click={handleKnob02Click}
      />
    </TvInstances>
  );
}

/* eslint-disable no-param-reassign */

export function InstancedTvInteractive({
  knob01Step = 0,
  stepsPerRotation = 12,

  onDial1Click,
  onDial2Click,
  onDial3Click,

  onKnob01Click,
  onKnob02Click,

  screenMaterial,
  power,
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
    }),
    [nodes]
  );

  // set base emissive colors once
  useEffect(() => {
    dialMats.power.emissive.set('#ff1a1a');
    dialMats.terminal.emissive.set('#00ff55');
    dialMats.vhs.emissive.set('#1a4dff');
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

  /* ---------- drive emissive every frame ---------- */

  useFrame(() => {
    dialMats.power.emissiveIntensity = powerGlow.glow.get() * 2;
    dialMats.terminal.emissiveIntensity = terminalGlow.glow.get() * 2;
    dialMats.vhs.emissiveIntensity = vhsGlow.glow.get() * 2;
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
          position={[0.291, 0.208, 0.092]}
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
          position={[0.328, 0.208, 0.092]}
          onClick={(e) => {
            e.stopPropagation();
            pressDial('dial3');
            onDial3Click?.();
            setTimeout(() => releaseDial('dial3'), 120);
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
