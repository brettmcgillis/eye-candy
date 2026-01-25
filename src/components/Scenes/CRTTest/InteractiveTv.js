import React, { useMemo, useRef, useState } from 'react';

import { useSpring } from '@react-spring/three';

import CRTBlueScreenMaterial from './CRTBlueScreenMaterial';
import CRTSceneInSceneMaterial from './CRTSceneInSceneMaterial';
import CRTSceneMaterial from './CRTSceneMaterial';
import CRTShowMaterial from './CRTShowMaterial';
import CRTSnowMaterial from './CRTSnowMaterial';
import CRTStaticMaterial from './CRTStaticMaterial';
import CRTTelevision from './CRTTelevision';
import TestScene from './TestScene';
import useInteractiveTvControls from './useInteractiveTvControls';

const KNOB_STEPS = 12;
const STEP_ANGLE = (Math.PI * 2) / KNOB_STEPS;

export default function InteractiveTv(props) {
  const { smtpe, snow, noSignal, terminal, homeVideo, tv, threeD, pip } =
    useInteractiveTvControls();

  const channels = useMemo(
    () => [
      <CRTSnowMaterial key="snow" {...snow} />,
      <CRTStaticMaterial key="static" {...smtpe} />,
      <CRTBlueScreenMaterial key="vhs" {...noSignal} />,
      <CRTBlueScreenMaterial key="terminal" {...terminal} />,
      <CRTShowMaterial key="homeVideo" useWebcam {...homeVideo} />,
      <CRTShowMaterial key="tv" {...tv} />,
      <CRTSceneMaterial key="threeD" scene={<TestScene />} {...threeD} />,
      <CRTSceneInSceneMaterial key="pip" {...pip} />,
    ],
    [snow, smtpe, noSignal, terminal, homeVideo, tv, threeD, pip]
  );

  const [power, setPower] = useState(false);
  const [channelIndex, setChannelIndex] = useState(0);
  const knobStep = useRef(0);

  const activeChannel = power ? channels[channelIndex % channels.length] : null;

  /* -------- Knobs -------- */

  const [knobSpring, knobApi] = useSpring(() => ({
    rot0: 0,
    rot1: 0,
    config: { tension: 220, friction: 18 },
  }));

  /* -------- Dial press -------- */

  const [pressSpring, pressApi] = useSpring(() => ({
    d0: 0,
    d1: 0,
    d2: 0,
  }));

  /* -------- LED springs (REAL emissive springs) -------- */

  const [ledSpring, ledApi] = useSpring(() => ({
    power: 0,
    aux1: 0,
    aux2: 0,
    config: { tension: 120, friction: 20 },
  }));

  const handleDialClick = () => {
    pressApi.start({ d0: 0.004 });
    setTimeout(() => pressApi.start({ d0: 0 }), 120);

    setPower((p) => {
      const next = !p;
      ledApi.start({ power: next ? 3 : 0, aux1: 0, aux2: 0 });
      return next;
    });
  };

  const handleKnobClick = () => {
    knobStep.current = (knobStep.current + 1) % KNOB_STEPS;
    knobApi.start({ rot0: knobStep.current * STEP_ANGLE });

    setChannelIndex((prev) => {
      const next = (prev + 1) % channels.length;

      ledApi.start({
        aux1: channels[next]?.key === 'terminal' ? 2 : 0,
        aux2: channels[next]?.key === 'vhs' ? 2 : 0,
      });

      return next;
    });
  };

  return (
    <CRTTelevision
      {...props}
      screenMaterial={activeChannel}
      knob0Rotation={knobSpring.rot0}
      knob1Rotation={knobSpring.rot1}
      dials={{
        dial0: {
          depth: pressSpring.d0,
          color: '#ff1a1a',
          intensity: ledSpring.power,
        },
        dial1: {
          depth: pressSpring.d1,
          color: '#00ff55',
          intensity: ledSpring.aux1,
        },
        dial2: {
          depth: pressSpring.d2,
          color: '#1a4dff',
          intensity: ledSpring.aux2,
        },
      }}
      onDialClick={handleDialClick}
      onKnobClick={handleKnobClick}
    />
  );
}
