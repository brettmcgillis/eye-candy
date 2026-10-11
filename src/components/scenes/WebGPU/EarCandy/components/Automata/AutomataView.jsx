import React, { memo, useCallback, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useStage from '../../hooks/useStage';
import useTickEffect from '../../hooks/useTickEffect';
import { degreeToMidi, scaleLength } from '../../utils/audio/music';
import {
  clear,
  createSim,
  generation,
  paint,
  scatter,
} from '../../utils/automata';
import PointerPlane from '../PointerPlane';
import Shapes from '../Shapes';

const LOOK_AHEAD = 0.12;
const GLOW_DECAY = 3.2;
const scratch = new THREE.Color();

function pickSome(list, count) {
  const pool = list.slice();
  const picked = [];
  while (picked.length < count && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

function AutomataView({ audio, c }) {
  const stage = useStage();
  const cellsRef = useRef(null);
  const paintRef = useRef(null);
  const { lifeCols: cols, lifeRows: rows } = c;
  const sim = useMemo(() => createSim(cols, rows, c.lifeDensity), [cols, rows]);
  const cellSize = Math.min(
    (stage.width * 0.94) / cols,
    (stage.height * 0.92) / rows
  );

  useTickEffect(c.scatterTick, () => scatter(sim, c.lifeDensity));
  useTickEffect(c.clearTick, () => clear(sim));

  const cellCenter = (i) => ({
    x: ((i % cols) + 0.5 - cols / 2) * cellSize,
    y: (Math.floor(i / cols) + 0.5 - rows / 2) * cellSize,
  });

  const voiceBirths = (births, offset) => {
    const len = scaleLength(c.scale);
    pickSome(births, c.lifeMaxNotes).forEach((i) => {
      const col = i % cols;
      const band = Math.floor((Math.floor(i / cols) / rows) * c.lifeOctaves);
      audio.play(c.lifeVoice, degreeToMidi(col + band * len, c), {
        duration: 0.3,
        offset,
        pan: (col / Math.max(1, cols - 1)) * 1.6 - 0.8,
        velocity: 0.45 + Math.random() * 0.4,
        ...cellCenter(i),
      });
    });
  };

  const voiceDeaths = (deaths, offset) => {
    const len = scaleLength(c.scale);
    pickSome(deaths, Math.ceil(c.lifeMaxNotes / 2)).forEach((i) => {
      const col = i % cols;
      audio.play(c.lifeVoiceB, degreeToMidi(col - len, c), {
        duration: 0.5,
        offset,
        pan: (col / Math.max(1, cols - 1)) * 1.6 - 0.8,
        velocity: 0.18 + Math.random() * 0.12,
        ...cellCenter(i),
      });
    });
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const beatSeconds = 60 / c.bpm;
    sim.beat = (sim.beat ?? 0) + dt / beatSeconds;
    if (sim.nextStep === null) sim.nextStep = sim.beat + 1 / c.lifeStepsPerBeat;
    const horizon = sim.beat + LOOK_AHEAD / beatSeconds;
    if (sim.nextStep < sim.beat - 1) sim.nextStep = sim.beat;

    while (sim.nextStep <= horizon) {
      const { births, deaths, population, stuck } = generation(
        sim,
        c.lifeRule,
        c.lifeWrap
      );
      const offset = Math.max(0, (sim.nextStep - sim.beat) * beatSeconds);
      voiceBirths(births, offset);
      if (c.lifeDeathNotes) voiceDeaths(deaths, offset);
      sim.queue.push({
        beat: sim.nextStep,
        births,
        cells: Uint8Array.from(sim.cells),
        deaths,
      });
      if (c.lifeAutoReseed && (population < 4 || stuck)) {
        scatter(sim, c.lifeDensity * 0.5);
        sim.history.length = 0;
      }
      sim.nextStep += 1 / c.lifeStepsPerBeat;
    }

    while (sim.queue.length && sim.queue[0].beat <= sim.beat) {
      const entry = sim.queue.shift();
      sim.display.set(entry.cells);
      entry.births.forEach((i) => {
        sim.birthGlow[i] = 1;
      });
      entry.deaths.forEach((i) => {
        sim.deathGlow[i] = 1;
      });
    }

    const shapes = cellsRef.current;
    if (!shapes) return;
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    const decay = Math.exp(-dt * GLOW_DECAY);
    for (let i = 0; i < cols * rows; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      scratch.setHSL((c.lifeHue + (col / cols) * 0.35) % 1, 0.7, 0.55);
      const birth = sim.birthGlow[i];
      const death = sim.deathGlow[i];
      let lift = 0.03 + death * 0.35;
      if (sim.display[i]) lift = 0.55 + birth * 0.9;
      shapes.set(
        i,
        -gridWidth / 2 + (col + 0.5) * cellSize,
        -gridHeight / 2 + (row + 0.5) * cellSize,
        cellSize * 0.84,
        cellSize * 0.84,
        0,
        scratch.r * lift,
        scratch.g * lift,
        scratch.b * lift
      );
      sim.birthGlow[i] = birth * decay;
      sim.deathGlow[i] = death * decay;
    }
    shapes.commit();
  });

  const cellAt = useCallback(
    (point) => {
      const col = Math.floor((point.x + (cols * cellSize) / 2) / cellSize);
      const row = Math.floor((point.y + (rows * cellSize) / 2) / cellSize);
      if (col < 0 || col >= cols || row < 0 || row >= rows) return -1;
      return row * cols + col;
    },
    [cols, rows, cellSize]
  );

  const handleDown = useCallback(
    (point, event) => {
      const index = cellAt(point);
      if (index < 0) return;
      paintRef.current = event.shiftKey || sim.cells[index] ? 0 : 1;
      paint(sim, index, paintRef.current);
    },
    [cellAt, sim]
  );

  const handleMove = useCallback(
    (point) => {
      if (paintRef.current === null) return;
      const index = cellAt(point);
      if (index >= 0) paint(sim, index, paintRef.current);
    },
    [cellAt, sim]
  );

  const handleUp = useCallback(() => {
    paintRef.current = null;
  }, []);

  return (
    <>
      <PointerPlane onDown={handleDown} onMove={handleMove} onUp={handleUp} />
      <Shapes ref={cellsRef} capacity={cols * rows} shape="quad" z={0.1} />
    </>
  );
}

export default memo(AutomataView);
