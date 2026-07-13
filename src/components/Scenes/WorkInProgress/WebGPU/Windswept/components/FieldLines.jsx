import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import FieldLineTrails from '../utils/FieldLineTrails';
import attractorFields from '../utils/attractorFields';
import createFieldLineMaterial from '../utils/createFieldLineMaterial';
import { STRANGE_ATTRACTORS_MODE } from '../utils/modes';

const MAX_DELTA = 0.05;
const SEGMENTS_PER_TRAIL = 400;
const SEED_SPREAD = 3;
const ESCAPE_MAGNITUDE = 12;

function seedWalker() {
  return new THREE.Vector3(
    (Math.random() - 0.5) * SEED_SPREAD,
    (Math.random() - 0.5) * SEED_SPREAD,
    (Math.random() - 0.5) * SEED_SPREAD
  );
}

// CPU-stepped streamlines tracing the same attractor field the GPU swarm
// follows (utils/attractorFields' deriveJS twin of the TSL derivative) — a
// handful of walkers integrate forward every frame and leave a fading
// ribbon via FieldLineTrails, tracing the flow's shape independent of the
// particle swarm riding it. The wrapping group is scaled by worldScale so
// the lines line up with the swarm's world-scaled positions without baking
// that scale into every vertex write. Strange-attractors mode only — a
// closed-form field only exists there (physical mode's force comes from
// discrete attractor objects, not attractorFields).
function FieldLines({ config }) {
  const groupRef = useRef(new THREE.Group());
  const stateRef = useRef(null);
  const clockRef = useRef(0);

  const { material, uniforms } = useMemo(
    () =>
      createFieldLineMaterial({
        color: config.fieldLineColor,
        opacity: config.fieldLineOpacity,
      }),
    // Built once — color/opacity/fade are pushed onto the uniforms live
    // every frame below, so this never needs to rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const group = groupRef.current;
    const trails = new FieldLineTrails(
      config.fieldLineCount,
      SEGMENTS_PER_TRAIL,
      material
    );
    const walkers = Array.from({ length: config.fieldLineCount }, () => ({
      position: seedWalker(),
    }));

    walkers.forEach((walker, i) => {
      trails.pushPoint(i, walker.position, clockRef.current, true);
    });
    trails.flush();

    group.add(trails);
    stateRef.current = { trails, walkers };

    return () => {
      group.remove(trails);
      trails.dispose();
      stateRef.current = null;
    };
  }, [config.fieldLineCount, material]);

  useFrame((_state, rawDelta) => {
    const state = stateRef.current;
    const active =
      config.showFieldLines && config.mode === STRANGE_ATTRACTORS_MODE;
    if (!state || !active) return;

    const { deriveJS } = attractorFields[config.attractorType];
    const delta = Math.min(Math.max(rawDelta, 1e-4), MAX_DELTA);
    clockRef.current += delta;
    const step = config.stepSize * config.speed * delta * 60;

    uniforms.color.value.set(config.fieldLineColor);
    uniforms.opacity.value = config.fieldLineOpacity;
    uniforms.fadeSec.value = config.fieldLineFade;
    uniforms.currentSec.value = clockRef.current;

    state.walkers.forEach((walker, i) => {
      const [dx, dy, dz] = deriveJS(walker.position, config.attractorB);
      walker.position.x += dx * step;
      walker.position.y += dy * step;
      walker.position.z += dz * step;

      if (walker.position.length() > ESCAPE_MAGNITUDE) {
        walker.position.copy(seedWalker());
        state.trails.pushPoint(i, walker.position, clockRef.current, true);
        return;
      }

      state.trails.pushPoint(i, walker.position, clockRef.current, false);
    });

    state.trails.flush();
  });

  return (
    <primitive
      object={groupRef.current}
      scale={config.worldScale}
      visible={config.showFieldLines && config.mode === STRANGE_ATTRACTORS_MODE}
    />
  );
}

export default memo(FieldLines);
