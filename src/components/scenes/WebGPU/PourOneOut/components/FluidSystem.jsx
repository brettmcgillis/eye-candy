import React, { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { FlipSimulator } from '@modules/flip';

import FluidRenderer from '../utils/FluidRenderer';
import SparseGrid from '../utils/SparseGrid';
import createCollider from '../utils/collider';
import { GRID, MAX_PARTICLES } from '../utils/domain';
import createEmitter from '../utils/emitter';

function FluidSystem({ config, plate, pins }) {
  const { gl } = useThree();
  const groupRef = useRef(new THREE.Group());
  const runtimeRef = useRef(null);
  const simConfigRef = useRef({});
  const latestRef = useRef({ config, plate, pins });
  latestRef.current = { config, plate, pins };

  useEffect(() => {
    const { backend } = gl;
    if (!backend || typeof backend.trackTimestamp !== 'boolean')
      return undefined;
    const previous = backend.trackTimestamp;
    backend.trackTimestamp = false;
    return () => {
      backend.trackTimestamp = previous;
    };
  }, [gl]);

  useEffect(() => {
    const group = groupRef.current;
    let cancelled = false;

    const setup = async () => {
      const collider = createCollider();
      const emitter = createEmitter(latestRef.current.config);
      const simulator = new FlipSimulator(gl, {
        collide: collider.collide,
        gridSize: GRID,
        maxParticles: MAX_PARTICLES,
        recycle: emitter.recycle,
        seed: emitter.seed,
        // The solver marks its own SOLID cells from the same signed distance
        // the particles collide against, so the pressure solve, the push-out
        // and the grid visualisation all agree on where the obstacles are.
        solid: collider.sampleSolid,
      });
      await simulator.init();
      if (cancelled) return;

      const fluid = new FluidRenderer(simulator);
      const grid = new SparseGrid(simulator);
      group.add(fluid.object);
      group.add(grid.object);
      runtimeRef.current = { collider, emitter, fluid, grid, simulator };
    };
    setup();

    return () => {
      cancelled = true;
      const runtime = runtimeRef.current;
      if (runtime) {
        group.remove(runtime.fluid.object);
        group.remove(runtime.grid.object);
        runtime.fluid.dispose();
        runtime.grid.dispose();
      }
      runtimeRef.current = null;
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const live = latestRef.current;
    const { collider, emitter, fluid, grid, simulator } = runtime;

    const delta = Math.min(rawDelta, 1 / 30);
    emitter.update(live.config, delta);
    collider.update(live.pins, live.plate, live.config);

    const simConfig = simConfigRef.current;
    simConfig.delta = delta;
    simConfig.densityCorrection = live.config.densityCorrection;
    simConfig.fluidity = live.config.fluidity;
    simConfig.gravity = live.config.gravity;
    simConfig.particles = live.config.particles;
    simConfig.pressureIterations = live.config.pressureIterations;
    simConfig.speed = live.config.speed;
    simConfig.targetDensity = live.config.targetDensity;
    simConfig.turbulence = live.config.turbulence;
    simulator.updateConfig(simConfig);

    if (live.config.runSimulation) simulator.step();

    fluid.update(live.config);
    grid.update(live.config);
    grid.compute(gl);
  });

  return <primitive object={groupRef.current} />;
}

export default memo(FluidSystem);
