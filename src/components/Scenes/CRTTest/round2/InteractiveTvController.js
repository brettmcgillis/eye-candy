/* eslint-disable no-param-reassign */

/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */

/* eslint-disable react/jsx-no-bind */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { animated, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';

/* ---------------------------------------------
   Parent / Orchestrator
---------------------------------------------- */
import { TvContext, TvInstances } from './TvInstances';
import useRcaCables from './useRcaCables';

export function InteractiveTvController({
  stepsPerRotation = 12,
  isTurnedOn = true,
  defaultChannel,
  surfChannels = false,
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

  const {
    channels,

    tuneChannel,
    powerOn,
    powerOff,

    knobClick,
    dialClick,

    attachToObject,
    unlockAudio,
    unlocked,
  } = useRcaCables();

  const channelIndexMap = useMemo(() => {
    const map = {};
    channels.forEach((c, i) => {
      if (c?.key != null) map[c.key] = i;
    });
    return map;
  }, [channels]);
  /* ---------- tv state ---------- */

  const [power, setPower] = useState(isTurnedOn);
  const [channelSurfing, setChannelSurfing] = useState(surfChannels);

  const [channelIndex, setChannelIndex] = useState(() => {
    if (defaultChannel && defaultChannel in channelIndexMap) {
      return channelIndexMap[defaultChannel];
    }
    return 0;
  });
  const [knobStep, setKnobStep] = useState(0);

  useEffect(() => {
    if (!power) powerOff();
    else {
      powerOn();
      tuneChannel(channelIndex);
    }
  }, [power]);

  useEffect(() => {
    if (power) tuneChannel(channelIndex);
  }, [channelIndex]);

  const activeChannel = power ? channels[channelIndex]?.video : null;

  /* ---------- handlers ---------- */
  function handleKnob01Click() {
    unlockAudio();
    knobClick();
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

  function handleDial4Click() {
    setChannelSurfing((s) => !s);
  }

  function handleKnob02Click() {
    console.log('knob 2 clicked (reserved)');
  }

  const surfTimer = useRef(0);
  const nextInterval = useRef(1 + Math.random() * 0.4);

  useFrame((_, delta) => {
    if (!power || !channelSurfing) {
      surfTimer.current = 0; // reset when not active
      return;
    }

    surfTimer.current += delta;

    if (surfTimer.current >= nextInterval.current) {
      surfTimer.current = 0;
      nextInterval.current = 1 + Math.random() * 0.6;
      handleKnob01Click();
    }
  });

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
        channelSurfing={channelSurfing}
        channelIndex={channelIndex}
        screenMaterial={activeChannel}
        onDial1Click={handleDial1Click}
        onDial2Click={handleDial2Click}
        onDial3Click={handleDial3Click}
        onDial4Click={handleDial4Click}
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
  onDial4Click,

  onKnob01Click,
  onKnob02Click,

  screenMaterial,
  power,
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
    }),
    [nodes]
  );

  // set base emissive colors once
  useEffect(() => {
    dialMats.power.emissive.set('#ff1a1a');
    dialMats.terminal.emissive.set('#00ff55');
    dialMats.vhs.emissive.set('#1a4dff');
    dialMats.surf.emissive.set('#d0d0d0');
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
  /* ---------- drive emissive every frame ---------- */

  useFrame(() => {
    dialMats.power.emissiveIntensity = powerGlow.glow.get() * 2;
    dialMats.terminal.emissiveIntensity = terminalGlow.glow.get() * 2;
    dialMats.vhs.emissiveIntensity = vhsGlow.glow.get() * 2;
    dialMats.surf.emissiveIntensity = surfGlow.glow.get() * 2;
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
