import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useStage from '../../hooks/useStage';
import { degreeToMidi } from '../../utils/audio/music';
import {
  MAX_PENDULUMS,
  crossingsInWindow,
  stringLength,
  swingAngle,
  swingFrequency,
} from '../../utils/pendulums';
import Shapes from '../Shapes';

const LOOK_AHEAD = 0.12;
const FLASH_DECAY = 5;
const scratch = new THREE.Color();

function PendulumsView({ audio, c }) {
  const stage = useStage();
  const stringRef = useRef(null);
  const bobRef = useRef(null);
  const tickRef = useRef(null);
  const barRef = useRef(null);
  const clock = useMemo(
    () => ({
      flash: new Float32Array(MAX_PENDULUMS),
      horizon: null,
      pending: [],
      time: 0,
    }),
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const speed = c.pendulumSpeed;
    clock.time += dt * speed;
    const horizon = clock.time + LOOK_AHEAD * speed;
    if (clock.horizon === null) clock.horizon = clock.time;

    const strings = stringRef.current;
    const bobs = bobRef.current;
    const ticks = tickRef.current;
    const bar = barRef.current;
    if (!strings || !bobs || !ticks || !bar) return;

    const count = c.pendulumCount;
    const spacing = (stage.width * 0.78) / Math.max(1, count - 1);
    const pivotY = stage.height * 0.46;
    const maxLength = stage.height * 0.8;
    scratch.set(c.pendulumColor);
    const { r, g, b } = scratch;

    for (let i = 0; i < MAX_PENDULUMS; i += 1) {
      if (i >= count) {
        strings.hide(i);
        bobs.hide(i);
        ticks.hide(i);
      } else {
        const x = (i - (count - 1) / 2) * spacing;
        const length = stringLength(i, maxLength, c);
        const midi = degreeToMidi(
          c.pendulumDegreeStart + i * c.pendulumDegreeStep,
          c
        );

        crossingsInWindow(swingFrequency(i, c), clock.horizon, horizon).forEach(
          (event) => {
            const wanted =
              c.pendulumDirection === 'both' ||
              (c.pendulumDirection === 'leftward') === event.leftward;
            if (!wanted) return;
            audio.play(
              event.leftward ? c.pendulumVoiceB : c.pendulumVoice,
              midi,
              {
                duration: 0.5,
                offset: Math.max(0, (event.time - clock.time) / speed),
                pan: (x / stage.width) * 1.8,
                x,
                y: pivotY - length - 2,
                velocity: 0.5 + Math.random() * 0.3,
              }
            );
            clock.pending.push({ index: i, time: event.time });
          }
        );

        const angle = swingAngle(i, clock.time, c);
        const bx = x + Math.sin(angle) * length;
        const by = pivotY - Math.cos(angle) * length;
        const flash = clock.flash[i];
        const size = 1.1 + flash * 1.2;
        const lift = 0.7 + flash * 1.2;
        strings.set(
          i,
          (x + bx) / 2,
          (pivotY + by) / 2,
          0.1,
          length,
          Math.PI + angle,
          r * 0.22,
          g * 0.22,
          b * 0.22
        );
        bobs.set(i, bx, by, size, size, 0, r * lift, g * lift, b * lift);
        ticks.set(
          i,
          x,
          pivotY - length,
          1.5,
          1.5,
          0,
          r * 0.3,
          g * 0.3,
          b * 0.3
        );
        clock.flash[i] *= Math.exp(-dt * FLASH_DECAY);
      }
    }

    clock.pending = clock.pending.filter((event) => {
      if (event.time > clock.time) return true;
      clock.flash[event.index] = 1;
      return false;
    });
    clock.horizon = horizon;

    bar.set(
      0,
      0,
      pivotY,
      stage.width * 0.84,
      0.25,
      0,
      r * 0.4,
      g * 0.4,
      b * 0.4
    );
    strings.commit();
    bobs.commit();
    ticks.commit();
    bar.commit();
  });

  return (
    <>
      <Shapes ref={barRef} capacity={1} shape="quad" z={0.05} />
      <Shapes ref={stringRef} capacity={MAX_PENDULUMS} shape="quad" z={0.1} />
      <Shapes
        ref={tickRef}
        capacity={MAX_PENDULUMS}
        inner={0.75}
        shape="ring"
        z={0.15}
      />
      <Shapes ref={bobRef} capacity={MAX_PENDULUMS} z={0.2} />
    </>
  );
}

export default memo(PendulumsView);
