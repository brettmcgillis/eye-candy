import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import FieldLineTrails from '../utils/FieldLineTrails';
import attractorFields, { paramKey } from '../utils/attractorFields';
import createFieldLineMaterial from '../utils/createFieldLineMaterial';
import {
  PHYSICAL_ATTRACTORS_MODE,
  STRANGE_ATTRACTORS_MODE,
} from '../utils/modes';
import {
  computeLiveAttractors,
  derivePhysicalForceJS,
} from '../utils/physicalAttractors';

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

// Reused across walkers within a single frame's loop (synchronous, fully
// consumed each iteration before the next) — lets the position update go
// through Vector3 methods instead of `walker.position.x += ...` assignment
// expressions, which no-param-reassign's props:true flags.
const stepVector = new THREE.Vector3();

// CPU-stepped streamlines tracing the same field the GPU swarm follows — a
// handful of walkers integrate forward every frame and leave a fading
// ribbon via FieldLineTrails, tracing the field's shape independent of the
// particle swarm riding it. The wrapping group is scaled by worldScale so
// the lines line up with the swarm's world-scaled positions without baking
// that scale into every vertex write.
//
// Strange-attractors mode walks utils/attractorFields' deriveJS, the plain-JS
// twin of the TSL derivative. Physical-attractors mode has no closed-form
// field — force comes from live, draggable, precessing attractor objects —
// so it instead walks utils/physicalAttractors' derivePhysicalForceJS, a
// plain-JS mirror of the same gravity+spin force the GPU step applies,
// fed computeLiveAttractors' output so the lines track the exact positions/
// axes (including "animate attractors" precession) the swarm is feeling.
function FieldLines({ attractorsRef, config }) {
  const groupRef = useRef(new THREE.Group());
  const stateRef = useRef(null);
  const clockRef = useRef(0);

  const { material, uniforms } = useMemo(
    () =>
      createFieldLineMaterial({
        color: config.fieldLineColor,
        opacity: config.fieldLineOpacity,
      }),
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
    const isPhysical = config.mode === PHYSICAL_ATTRACTORS_MODE;
    const active =
      config.showFieldLines &&
      (config.mode === STRANGE_ATTRACTORS_MODE || isPhysical);
    if (!state || !active) return;

    const delta = Math.min(Math.max(rawDelta, 1e-4), MAX_DELTA);
    clockRef.current += delta;
    const step = config.stepSize * config.fieldLineSpeed * delta * 60;

    uniforms.color.value.set(config.fieldLineColor);
    uniforms.opacity.value = config.fieldLineOpacity;
    uniforms.fadeSec.value = config.fieldLineFade;
    uniforms.currentSec.value = clockRef.current;

    let deriveAt;
    if (isPhysical) {
      const liveAttractors = computeLiveAttractors(
        attractorsRef,
        config,
        clockRef.current
      );
      deriveAt = (position) =>
        derivePhysicalForceJS(
          position,
          liveAttractors,
          config.attractorStrength,
          config.spinStrength
        );
    } else {
      const entry = attractorFields[config.attractorType];
      const params = {};
      entry.paramNames.forEach((name) => {
        const key = paramKey(entry.key, name);
        params[name] = config[key] ?? entry.defaults[name];
      });
      deriveAt = (position) => entry.deriveJS(position, params);
    }

    state.walkers.forEach((walker, i) => {
      const [dx, dy, dz] = deriveAt(walker.position);
      stepVector.set(dx, dy, dz);
      walker.position.addScaledVector(stepVector, step);

      if (walker.position.length() > ESCAPE_MAGNITUDE) {
        walker.position.copy(seedWalker());
        state.trails.pushPoint(i, walker.position, clockRef.current, true);
        return;
      }

      state.trails.pushPoint(i, walker.position, clockRef.current, false);
    });

    state.trails.flush();
  });

  const visible =
    config.showFieldLines &&
    (config.mode === STRANGE_ATTRACTORS_MODE ||
      config.mode === PHYSICAL_ATTRACTORS_MODE);

  return (
    <primitive
      object={groupRef.current}
      scale={config.worldScale}
      visible={visible}
    />
  );
}

export default memo(FieldLines);
