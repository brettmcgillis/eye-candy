import React, { memo, useCallback, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useStage from '../../hooks/useStage';
import { degreeToMidi } from '../../utils/audio/music';
import {
  MAX_RIPPLES,
  MAX_SPARKS,
  addRipple,
  createSim,
  stepSim,
} from '../../utils/ripples';
import PointerPlane from '../PointerPlane';
import Shapes from '../Shapes';

const RINGS_PER_RIPPLE = 3;
const RING_FADE = [1, 0.5, 0.22];
const MAX_NOTES_PER_FRAME = 4;

function RipplesView({ audio, c }) {
  const stage = useStage();
  const sim = useMemo(createSim, []);
  const ringRef = useRef(null);
  const sparkRef = useRef(null);
  const notesRef = useRef(0);
  const ripple = useMemo(() => new THREE.Color(c.rippleColor), [c.rippleColor]);
  const spark = useMemo(() => new THREE.Color(c.sparkColor), [c.sparkColor]);

  const handleIntersect = (hit) => {
    if (notesRef.current >= MAX_NOTES_PER_FRAME) return;
    notesRef.current += 1;
    const voices = [c.rippleVoiceA, c.rippleVoiceB, c.rippleVoiceC];
    const degree = Math.floor(Math.random() * c.rippleSpan);
    audio.play(
      voices[Math.floor(Math.random() * voices.length)],
      degreeToMidi(degree, c),
      {
        duration: 0.5 + Math.random() * 0.9,
        pan: (hit.x / stage.width) * 2,
        x: hit.x,
        y: hit.y,
        quantize: c.quantize,
        velocity:
          c.velocityMin + Math.random() * (c.velocityMax - c.velocityMin),
      }
    );
  };

  useFrame((_, delta) => {
    notesRef.current = 0;
    stepSim(sim, Math.min(delta, 1 / 30), c, stage, handleIntersect);

    const rings = ringRef.current;
    const sparks = sparkRef.current;
    if (!rings || !sparks) return;

    for (let i = 0; i < MAX_RIPPLES; i += 1) {
      const wave = sim.ripples[i];
      for (let k = 0; k < RINGS_PER_RIPPLE; k += 1) {
        const slot = i * RINGS_PER_RIPPLE + k;
        const radius = wave ? wave.r - k * c.ringGap : 0;
        if (wave && radius > 0.3) {
          const lift = wave.amp * RING_FADE[k];
          rings.set(
            slot,
            wave.x,
            wave.y,
            radius,
            radius,
            0,
            ripple.r * lift,
            ripple.g * lift,
            ripple.b * lift
          );
        } else {
          rings.hide(slot);
        }
      }
    }
    for (let i = 0; i < MAX_SPARKS; i += 1) {
      const s = sim.sparks[i];
      if (s) {
        const lift = Math.exp(-s.age * 3.2) * (0.5 + s.strength);
        const size = 0.6 + s.age * 2.2;
        sparks.set(
          i,
          s.x,
          s.y,
          size,
          size,
          0,
          spark.r * lift,
          spark.g * lift,
          spark.b * lift
        );
      } else {
        sparks.hide(i);
      }
    }
    rings.commit();
    sparks.commit();
  });

  const handleDown = useCallback(
    (point) => addRipple(sim, point.x, point.y),
    [sim]
  );

  return (
    <>
      <PointerPlane onDown={handleDown} />
      <Shapes
        ref={ringRef}
        capacity={MAX_RIPPLES * RINGS_PER_RIPPLE}
        inner={0.93}
        shape="ring"
        z={0.1}
      />
      <Shapes ref={sparkRef} capacity={MAX_SPARKS} z={0.3} />
    </>
  );
}

export default memo(RipplesView);
