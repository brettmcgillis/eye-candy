/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */

/* eslint-disable react/jsx-no-bind */
import React, { useContext, useMemo, useState } from 'react';
import * as THREE from 'three';

import { animated, useSpring } from '@react-spring/three';

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
  isTurnedOn = false,
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
      <CRTBlueScreenMaterial key="vhs" {...VHSSetting} />,
      <CRTBlueScreenMaterial key="terminal" {...TerminalSetting} />,
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

  function handleKnobClick() {
    setKnobStep((s) => s + 1);
    setChannelIndex((i) => (i + 1) % channels.length);
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
        onKnob01Click={handleKnobClick}
        screenMaterial={activeChannel}
      />
    </TvInstances>
  );
}

export function InstancedTvInteractive({
  knob01Step = 0,
  stepsPerRotation = 12,
  onKnob01Click,
  screenMaterial,
  ...props
}) {
  const { merged, nodes, screenGeo } = useContext(TvContext);

  const stepAngle = (Math.PI * 2) / stepsPerRotation;

  const { knobRotation } = useSpring({
    knobRotation: -(knob01Step * stepAngle),
    config: { tension: 180, friction: 20 },
  });

  return (
    <group {...props}>
      <group rotation={[-Math.PI, -Math.PI, -Math.PI]}>
        {/* body (instanced) */}
        <merged.Body />

        {/* dials (non-instanced so you can emissive later) */}
        <primitive
          object={nodes.dial_01.clone()}
          position={[0.254, 0.208, 0.092]}
        />
        <primitive
          object={nodes.dial_02.clone()}
          position={[0.291, 0.208, 0.092]}
        />
        <primitive
          object={nodes.dial_03.clone()}
          position={[0.328, 0.208, 0.092]}
        />

        {/* knobs (instanced) */}
        <animated.group
          position={[0.291, 0.406, 0.097]}
          rotation-z={knobRotation}
        >
          <merged.Knob onClick={onKnob01Click} />
        </animated.group>

        <merged.Knob1 position={[0.291, 0.289, 0.097]} />

        {/* screen (unique per TV) */}
        <mesh
          geometry={screenGeo}
          position={[-0.077, 0.262, 0.07]}
          rotation={[0, 0, -3.13]}
        >
          {screenMaterial ?? <meshStandardMaterial color="#111" />}
        </mesh>
      </group>
    </group>
  );
}
