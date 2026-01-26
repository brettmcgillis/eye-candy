/* eslint-disable no-param-reassign */

/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */

/* eslint-disable react/jsx-no-bind */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useFrame } from '@react-three/fiber';

import InstancedTvInteractive from './InstancedTvInteractive';
import { TvInstances } from './TvInstances';
import useRcaCables from './useRcaCables';

export default function InteractiveTvController({
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
