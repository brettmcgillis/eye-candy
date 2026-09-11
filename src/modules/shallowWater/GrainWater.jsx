import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { instancedArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import useRenderScale from '@hooks/useRenderScale';

import WaterSolver from './WaterSolver';
import createGrainCompute, { createGrainSeed } from './grains/grainCompute';
import createGrainMaterial from './grains/grainMaterial';
import { applyGrainUniforms, buildGrainUniforms } from './grains/grainUniforms';

// Water, whitewater and ground as a single instanced grain field sorted into
// two populations at layout time, which is what lets a waterline be a dithered
// band of interleaved grains rather than a seam between two meshes.
//
// The scene owns the bake and the layout and hands both in; this owns the
// solver, the buffers and the mesh. Two effects, not one: only the grain count
// and the solver grid size the buffers and the kernels, so only those rebuild
// anything. Reshaping the ground re-bakes the bed and re-sorts the grains into
// the running simulation instead of tearing it down -- which is what makes the
// terrain controls usable by eye, rather than dropping the water state and
// re-running the whole warm-up on every frame of a drag.
function GrainWater({ config, driver, field, layout, resolution, worldSize }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);

  useRenderScale(config.renderScale);

  const latest = useRef({ field, layout });
  latest.current = { field, layout };

  useEffect(() => {
    const { field: baked, layout: sorted } = latest.current;

    const solver = new WaterSolver({
      driver,
      field: baked,
      resolution,
      worldSize,
    });
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
      worldSize,
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
      bakedField: baked,
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
    // Deliberately narrow: only the things that size a buffer or a kernel.
    // Reshaping the ground is handled by the rebake effect below, and
    // everything a preset switch normally moves is a live uniform.
  }, [driver, gl, layout.total, resolution, scene, worldSize]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.bakedField === field) return;

    // The rebase needs the bed this water was last solved against, so it rides
    // along in the spare channel of the buffer being uploaded.
    const previous = runtime.bakedField;
    const next = field;
    for (let i = 2; i < next.length; i += 4) next[i] = previous[i - 2];

    runtime.solver.rebake(gl, next);
    runtime.buffers.home.value.array.set(layout.home);
    runtime.buffers.home.value.needsUpdate = true;
    runtime.bakedField = next;
  }, [field, gl, layout]);

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

export default memo(GrainWater);
