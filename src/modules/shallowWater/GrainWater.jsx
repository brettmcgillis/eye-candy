import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { instancedArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import useRenderScale from '@hooks/useRenderScale';

import SurfSolver from '../runtime/SurfSolver';
import { applyStacks, buildCoastTerrain } from '../runtime/coastField';
import createGrainCompute, { createGrainSeed } from '../runtime/grainCompute';
import createGrainLayout from '../runtime/grainLayout';
import createGrainMaterial from '../runtime/grainMaterial';
import {
  applyGrainUniforms,
  buildGrainUniforms,
} from '../runtime/grainUniforms';

// The whole scene is this one mesh. Water, whitewater and rock are a single
// instanced grain field sorted into two populations at layout time, which is
// what lets the coastline be a dithered band of interleaved grains rather than
// a seam between two meshes.
//
// Two effects, not one. Only the grain count and the solver grid size the
// buffers and the kernels, so only those rebuild anything; reshaping the coast
// re-bakes the bed and re-sorts the grains into the running simulation instead
// of tearing it down. That is what makes the shore controls usable by eye --
// dragging Stack Size used to drop the wave state and re-run the whole warm-up
// on every frame of the drag.
function GrainField({ config }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);

  useRenderScale(config.renderScale);

  // The expensive half: shelf, coastline and rock. Cached apart from the
  // stacks so that tuning stacks by eye does not pay for twenty octaves of
  // noise on every cell of the grid.
  const terrain = useMemo(
    () =>
      buildCoastTerrain({
        coastLine: config.coastLine,
        coastRagged: config.coastRagged,
        coastTilt: config.coastTilt,
        deepDepth: config.deepDepth,
        reefRelief: config.reefRelief,
        resolution: config.solverResolution,
        rockHeight: config.rockHeight,
        rockRelief: config.rockRelief,
        rockRise: config.rockRise,
        shelfWidth: config.shelfWidth,
        shoreSeed: config.shoreSeed,
        slopeCurve: config.slopeCurve,
      }),
    [
      config.coastLine,
      config.coastRagged,
      config.coastTilt,
      config.deepDepth,
      config.reefRelief,
      config.rockHeight,
      config.rockRelief,
      config.rockRise,
      config.shelfWidth,
      config.shoreSeed,
      config.slopeCurve,
      config.solverResolution,
    ]
  );

  // The cheap half: only the cells inside a stack's reach are touched.
  const coast = useMemo(
    () => ({
      field: applyStacks(terrain, {
        coastLine: config.coastLine,
        coastRagged: config.coastRagged,
        coastTilt: config.coastTilt,
        resolution: config.solverResolution,
        shoreSeed: config.shoreSeed,
        stackCount: config.stackCount,
        stackSize: config.stackSize,
      }),
      resolution: config.solverResolution,
    }),
    [
      terrain,
      config.coastLine,
      config.coastRagged,
      config.coastTilt,
      config.shoreSeed,
      config.solverResolution,
      config.stackCount,
      config.stackSize,
    ]
  );

  // Which grains are rock is decided against the bed, so this re-runs whenever
  // the coast moves as well as when the waterline itself is retuned.
  const layout = useMemo(
    () =>
      createGrainLayout({
        count: config.grainCount,
        field: coast.field,
        jitter: config.grainJitter,
        resolution: coast.resolution,
        roleFeather: config.roleFeather,
        seed: config.shoreSeed,
        waterline: config.waterline,
      }),
    [
      coast,
      config.grainCount,
      config.grainJitter,
      config.roleFeather,
      config.shoreSeed,
      config.waterline,
    ]
  );

  const latest = useRef({ coast, layout });
  latest.current = { coast, layout };

  useEffect(() => {
    const { coast: baked, layout: sorted } = latest.current;
    const { resolution } = baked;

    const solver = new SurfSolver({ field: baked.field, resolution });
    const buffers = {
      home: instancedArray(sorted.home, 'vec4'),
      look: instancedArray(sorted.total, 'vec4'),
      motion: instancedArray(sorted.total, 'vec4'),
      // Per-grain surface state that outlives the water on top of it: .x is
      // how wet the ground is, with memory.
      skin: instancedArray(sorted.total, 'vec4'),
      state: instancedArray(sorted.total, 'vec4'),
    };
    const uniforms = buildGrainUniforms();

    const shared = {
      buffers,
      count: sorted.total,
      field: solver.field,
      res: resolution,
    };
    const seedKernel = createGrainSeed(shared);
    const grainKernel = createGrainCompute({
      ...shared,
      foamTexture: solver.foamTexture,
      heightTexture: solver.heightTexture,
      uniforms,
    });

    const geometry = new THREE.InstancedBufferGeometry().copy(
      new THREE.BoxGeometry(1, 1, 1)
    );
    geometry.instanceCount = sorted.total;

    const material = createGrainMaterial({ buffers, uniforms });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    runtimeRef.current = {
      // What the solver's water was last solved against. The rebake effect
      // compares against this both to skip the redundant pass right after a
      // build, and to hand the previous bed to the rebase.
      bakedField: baked.field,
      buffers,
      geometry,
      grainKernel,
      material,
      mesh,
      seedKernel,
      seeded: false,
      solver,
      uniforms,
    };

    return () => {
      runtimeRef.current = null;
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      solver.dispose();
    };
    // Deliberately narrow: only the two things that size a buffer or a kernel.
    // Reshaping the coast is handled by the rebake effect below, and everything
    // a preset switch normally moves is a live uniform.
  }, [config.grainCount, config.solverResolution, gl, scene]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.bakedField === coast.field) return;

    // The rebase needs the bed this water was last solved against, so it rides
    // along in the spare channel of the buffer being uploaded.
    const previous = runtime.bakedField;
    const next = coast.field;
    for (let i = 2; i < next.length; i += 4) next[i] = previous[i - 2];

    runtime.solver.rebake(gl, next);
    runtime.buffers.home.value.array.set(layout.home);
    runtime.buffers.home.value.needsUpdate = true;
    runtime.bakedField = next;
  }, [coast, layout, gl]);

  useFrame((_, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    if (!runtime.seeded) {
      runtime.solver.flood(gl);
      gl.compute(runtime.seedKernel);
      runtime.seeded = true;
    }

    runtime.solver.update(config);
    if (config.runSimulation) runtime.solver.step(gl, delta, config);

    // Grains step once per frame against the settled half of the solver, not
    // once per substep: they are dressing over the fields, and stepping them
    // four times would quadruple the expensive half of the scene for motion
    // nothing can see.
    const step = Math.min(delta, 1 / 30) * config.timeScale;
    applyGrainUniforms(runtime.uniforms, config);
    runtime.uniforms.dt.value = step;
    runtime.uniforms.phase.value += step;
    gl.compute(runtime.grainKernel);
  });

  return null;
}

export default memo(GrainField);
