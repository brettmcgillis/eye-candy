import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useStage from '../../hooks/useStage';
import useTickEffect from '../../hooks/useTickEffect';
import { degreeToMidi, scaleLength } from '../../utils/audio/music';
import {
  MAX_BUMPERS,
  MAX_PARTICLES,
  SPAWN_POINTS_MAX,
  addBumper,
  createSim,
  pickBumper,
  scatterBumpers,
  spawnX,
  stepSim,
} from '../../utils/pachinko';
import PointerPlane from '../PointerPlane';
import Shapes from '../Shapes';

const PARTICLE_RADIUS = 0.7;

function PachinkoView({ audio, c }) {
  const stage = useStage();
  const sim = useMemo(createSim, []);
  const dragRef = useRef(null);
  const bodyRef = useRef(null);
  const rimRef = useRef(null);
  const dropRef = useRef(null);
  const spoutRef = useRef(null);
  const bumperColor = useMemo(
    () => new THREE.Color(c.bumperColor),
    [c.bumperColor]
  );
  const dropColor = useMemo(
    () => new THREE.Color(c.particleColor),
    [c.particleColor]
  );

  const scatter = useCallback(
    () => scatterBumpers(sim, stage, c.bumperCount, c.bumperSize),
    [sim, stage, c.bumperCount, c.bumperSize]
  );

  useEffect(() => {
    scatter();
  }, []);
  useTickEffect(c.scatterTick, scatter);
  useTickEffect(c.clearTick, () => {
    sim.bumpers.length = 0;
  });

  const handleHit = (bumper, impact) => {
    const t = THREE.MathUtils.clamp(bumper.x / stage.width + 0.5, 0, 0.999);
    const big = bumper.r > c.bumperSize;
    const degree =
      Math.floor(t * c.degreeSpan) - (big ? scaleLength(c.scale) : 0);
    audio.play(big ? c.lowVoice : c.highVoice, degreeToMidi(degree, c), {
      duration: 0.25 + bumper.r * 0.08,
      pan: (bumper.x / stage.width) * 2,
      x: bumper.x,
      y: bumper.y + bumper.r,
      quantize: c.quantize,
      velocity: THREE.MathUtils.clamp(impact / 40, 0.15, 1),
    });
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    stepSim(
      sim,
      dt,
      { ...c, particleRadius: PARTICLE_RADIUS * c.particleSize },
      stage,
      handleHit
    );

    const body = bodyRef.current;
    const rim = rimRef.current;
    const drops = dropRef.current;
    const spouts = spoutRef.current;
    if (!body || !rim || !drops || !spouts) return;

    for (let i = 0; i < MAX_BUMPERS; i += 1) {
      const b = sim.bumpers[i];
      if (b) {
        const lift = 0.14 + b.glow * 0.9;
        body.set(
          i,
          b.x,
          b.y,
          b.r,
          b.r,
          0,
          bumperColor.r * lift,
          bumperColor.g * lift,
          bumperColor.b * lift
        );
        const edge = 0.5 + b.glow;
        rim.set(
          i,
          b.x,
          b.y,
          b.r,
          b.r,
          0,
          bumperColor.r * edge,
          bumperColor.g * edge,
          bumperColor.b * edge
        );
      } else {
        body.hide(i);
        rim.hide(i);
      }
    }
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      if (sim.alive[i]) {
        const r = PARTICLE_RADIUS * c.particleSize;
        drops.set(
          i,
          sim.px[i],
          sim.py[i],
          r,
          r,
          0,
          dropColor.r,
          dropColor.g,
          dropColor.b
        );
      } else {
        drops.hide(i);
      }
    }
    for (let i = 0; i < SPAWN_POINTS_MAX; i += 1) {
      if (i < c.spawnPoints) {
        spouts.set(
          i,
          spawnX(i, c.spawnPoints, stage),
          stage.height / 2 - 1,
          1.6,
          1.6,
          0,
          dropColor.r * 0.35,
          dropColor.g * 0.35,
          dropColor.b * 0.35
        );
      } else {
        spouts.hide(i);
      }
    }
    body.commit();
    rim.commit();
    drops.commit();
    spouts.commit();
  });

  const handleDown = useCallback(
    (point, event) => {
      const hit = pickBumper(sim, point.x, point.y);
      const remove = event.shiftKey || event.button === 2;
      if (hit && remove) {
        sim.bumpers.splice(sim.bumpers.indexOf(hit), 1);
        return;
      }
      if (remove) return;
      const target =
        hit ||
        addBumper(
          sim,
          point.x,
          point.y,
          c.bumperSize * (0.7 + Math.random() * 0.7)
        );
      if (target) {
        dragRef.current = {
          bumper: target,
          dx: target.x - point.x,
          dy: target.y - point.y,
        };
      }
    },
    [sim, c.bumperSize]
  );

  const handleMove = useCallback((point) => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.bumper.x = point.x + drag.dx;
    drag.bumper.y = point.y + drag.dy;
  }, []);

  const handleUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <>
      <PointerPlane onDown={handleDown} onMove={handleMove} onUp={handleUp} />
      <Shapes ref={bodyRef} capacity={MAX_BUMPERS} z={0.1} />
      <Shapes
        ref={rimRef}
        capacity={MAX_BUMPERS}
        inner={0.88}
        shape="ring"
        z={0.2}
      />
      <Shapes ref={dropRef} capacity={MAX_PARTICLES} z={0.3} />
      <Shapes
        ref={spoutRef}
        capacity={SPAWN_POINTS_MAX}
        inner={0.7}
        shape="ring"
        z={0.05}
      />
    </>
  );
}

export default memo(PachinkoView);
