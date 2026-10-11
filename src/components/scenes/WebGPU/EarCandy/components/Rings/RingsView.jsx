import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useStage from '../../hooks/useStage';
import { degreeToMidi } from '../../utils/audio/music';
import {
  MAX_RINGS,
  MAX_STEPS,
  euclidHits,
  hitsInWindow,
  ringConfig,
  ringRadii,
} from '../../utils/rings';
import Shapes from '../Shapes';

const LOOK_AHEAD = 0.12;
const FLASH_DECAY = 4.5;
const scratch = new THREE.Color();

function RingsView({ audio, c }) {
  const stage = useStage();
  const beadRef = useRef(null);
  const trackRef = useRef(null);
  const headRef = useRef(null);
  const clock = useMemo(
    () => ({
      flash: new Float32Array(MAX_RINGS * MAX_STEPS),
      horizon: null,
      pending: [],
      phase: 0,
    }),
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const cycleSeconds = (c.ringCycleBeats * 60) / c.bpm;
    clock.phase += dt / cycleSeconds;
    const horizon = clock.phase + LOOK_AHEAD / cycleSeconds;
    if (clock.horizon === null) clock.horizon = clock.phase;

    const radii = ringRadii(c.ringCount, stage);
    const beads = beadRef.current;
    const tracks = trackRef.current;
    const head = headRef.current;
    if (!beads || !tracks || !head) return;

    for (let k = 0; k < MAX_RINGS; k += 1) {
      if (k >= c.ringCount) {
        tracks.hide(k);
        for (let i = 0; i < MAX_STEPS; i += 1) beads.hide(k * MAX_STEPS + i);
      } else {
        const ring = ringConfig(c, k);
        const hits = euclidHits(ring);
        const midi = degreeToMidi(ring.degree, c);
        scratch.setHSL((c.ringHue + k * 0.09) % 1, 0.75, 0.6);
        const { r, g, b } = scratch;

        hitsInWindow(hits, clock.horizon, horizon).forEach((event) => {
          const beadAngle = (event.step / ring.steps) * Math.PI * 2;
          audio.play(ring.voice, midi, {
            duration: 0.35,
            offset: Math.max(0, (event.phase - clock.phase) * cycleSeconds),
            pan: ((k % 2 ? -1 : 1) * (0.2 + 0.1 * k)) / 1.2,
            x: Math.sin(beadAngle) * radii[k],
            y: Math.cos(beadAngle) * radii[k] + 1.6,
            velocity: 0.55 + 0.35 * Math.random(),
          });
          clock.pending.push({
            phase: event.phase,
            slot: k * MAX_STEPS + event.step,
          });
        });

        tracks.set(
          k,
          0,
          0,
          radii[k],
          radii[k],
          0,
          r * 0.16,
          g * 0.16,
          b * 0.16
        );
        for (let i = 0; i < MAX_STEPS; i += 1) {
          const slot = k * MAX_STEPS + i;
          if (i < ring.steps) {
            const angle = (i / ring.steps) * Math.PI * 2;
            const flash = clock.flash[slot];
            const size = hits[i] ? 1 + flash * 0.9 : 0.34;
            const lift = hits[i] ? 0.55 + flash : 0.22;
            beads.set(
              slot,
              Math.sin(angle) * radii[k],
              Math.cos(angle) * radii[k],
              size,
              size,
              0,
              r * lift,
              g * lift,
              b * lift
            );
          } else {
            beads.hide(slot);
          }
          clock.flash[slot] *= Math.exp(-dt * FLASH_DECAY);
        }
      }
    }

    clock.pending = clock.pending.filter((event) => {
      if (event.phase > clock.phase) return true;
      clock.flash[event.slot] = 1;
      return false;
    });
    clock.horizon = horizon;

    const angle = (clock.phase % 1) * Math.PI * 2;
    const length = stage.height * 0.47;
    head.set(
      0,
      Math.sin(angle) * length * 0.5,
      Math.cos(angle) * length * 0.5,
      0.14,
      length,
      -angle,
      0.5,
      0.5,
      0.55
    );
    beads.commit();
    tracks.commit();
    head.commit();
  });

  return (
    <>
      <Shapes
        ref={trackRef}
        capacity={MAX_RINGS}
        inner={0.992}
        shape="ring"
        z={0.05}
      />
      <Shapes ref={headRef} capacity={1} shape="quad" z={0.1} />
      <Shapes ref={beadRef} capacity={MAX_RINGS * MAX_STEPS} z={0.2} />
    </>
  );
}

export default memo(RingsView);
