/* eslint-disable no-param-reassign */

/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */

/* eslint-disable react/jsx-no-bind */
import React, { useMemo, useState } from 'react';
import * as THREE from 'three';

import InstancedTvInteractive from './InstancedTvInteractive';
import { TvInstances } from './TvInstances';
import useRcaCables from './useRcaCables';

export default function InteractiveTvController({
  stepsPerRotation = 12,
  isTurnedOn = true,
  defaultChannel = 'snow',
  isSurfingChannels = false,
  isOnMute = false,
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
    /* state */
    channels,
    activeChannel,
    channelIndex,
    channelKey,
    power,
    surfing,
    muted,
    unlocked,

    /* controls */
    powerOn,
    powerOff,
    togglePower,

    muteOn,
    muteOff,
    toggleMute,

    nextChannel,
    setChannelByKey,

    surfOn,
    surfOff,
    toggleSurfing,

    /* audio */
    knobClick,
    dialClick,
    unlockAudio,
    attachToObject,
  } = useRcaCables({
    initialPower: isTurnedOn,
    defaultChannelKey: defaultChannel,
    surfChannels: isSurfingChannels,
    initialMuted: isOnMute,
  });

  /* ---------- tv state ---------- */

  const [knobStep, setKnobStep] = useState(0);

  /* ---------- handlers ---------- */
  function handleKnob01Click() {
    knobClick();
    nextChannel();
    setKnobStep((s) => s + 1);
  }

  function handleDial1Click() {
    dialClick();
    togglePower();
  }

  function handleDial2Click() {
    dialClick();
    if (!power) {
      togglePower();
    }
    if (surfing) {
      toggleSurfing();
    }
    setChannelByKey('terminal'); // terminal
  }

  function handleDial3Click() {
    dialClick();
    if (!power) {
      togglePower();
    }
    if (surfing) {
      toggleSurfing();
    }
    setChannelByKey('vhs'); // terminal
  }

  function handleDial4Click() {
    dialClick();
    toggleSurfing();
  }

  function handleDial5Click() {
    dialClick();
    toggleMute();
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
        channelSurfing={surfing}
        channelIndex={channelIndex}
        screenMaterial={activeChannel?.video ?? null}
        onDial1Click={handleDial1Click}
        onDial2Click={handleDial2Click}
        onDial3Click={handleDial3Click}
        onDial4Click={handleDial4Click}
        onDial5Click={handleDial5Click}
        onKnob01Click={handleKnob01Click}
        onKnob02Click={handleKnob02Click}
      />
    </TvInstances>
  );
}
