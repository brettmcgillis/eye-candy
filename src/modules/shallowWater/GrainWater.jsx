import React, { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { instancedArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import useRenderScale from '@hooks/useRenderScale';

import WaterSolver from './WaterSolver';
import BrushPlane from './brush/BrushPlane';
import applyDrift from './drift';
import createGrainCompute, { createGrainSeed } from './grains/grainCompute';
import createGrainMaterial from './grains/grainMaterial';
import { applyGrainUniforms, buildGrainUniforms } from './grains/grainUniforms';

// Which of the brush's four gains a tool drives. Everything not listed is
// zero, which is how one pair of kernels covers moving ground, depositing it,
// scouring it out and shoving the water around without a mode branch on the
// GPU.
const DOME_GAIN = { Deposit: 1, Scour: -1 };
const PUSH_GAIN = { 'Push Ground': 1 };
const WATER_LIFT = { 'Push Water': 0.4 };
const WATER_PUSH = { 'Push Water': 1 };

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
function GrainWater({
  config,
  drift,
  driver,
  field,
  layout,
  resolution,
  worldSize,
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);

  // Outlives the solver: a resolution change should not reset what hour of the
  // day the scene had drifted to.
  const driftRef = useRef({ phase: 0, config: {} });
  const strokeRef = useRef({ active: false, dx: 0, dz: 0, x: 0, z: 0 });
  const brushRef = useRef({
    domeGain: 0,
    dx: 0,
    dz: 0,
    pushGain: 0,
    radius: 1,
    waterLift: 0,
    waterPush: 0,
    x: 0,
    z: 0,
  });

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

    const previous = runtime.bakedField;
    const next = field;

    // Two different questions. A bed that moved under an unchanged rest
    // surface is a stack slider or a boulder slider, and the water on top of
    // it should survive. A rest surface that moved is a different place --
    // change a reach's gradient and the whole datum tilts -- and preserving
    // the old surface there leaves the top of the domain dry and the bottom
    // ponded, with no warm-up left to recover.
    let surfaceMoved = false;
    for (let i = 3; i < next.length; i += 4) {
      if (next[i] !== previous[i]) {
        surfaceMoved = true;
        break;
      }
    }

    if (surfaceMoved) {
      runtime.solver.reflood(gl, next);
    } else {
      // The rebase needs the bed this water was last solved against, so it
      // rides along in the spare channel of the buffer being uploaded.
      for (let i = 2; i < next.length; i += 4) next[i] = previous[i - 2];
      runtime.solver.rebake(gl, next);
    }

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

    const wandering = drift && config.driftEnabled && config.driftAmount > 0;
    if (wandering) driftRef.current.phase += delta * config.driftRate;
    const active = drift
      ? applyDrift(
          driftRef.current.config,
          config,
          drift,
          driftRef.current.phase,
          wandering ? config.driftAmount : 0
        )
      : config;

    runtime.solver.update(active);
    if (active.runSimulation) {
      runtime.solver.step(gl, delta, active);
      if (active.morphologyEnabled) runtime.solver.erode(gl, delta, active);
    }

    // Grains step once per frame against the settled half of the solver, not
    // once per substep: they are dressing over the fields, and stepping them
    // four times would quadruple the expensive half of the scene for motion
    // nothing can see.
    const stroke = strokeRef.current;
    if (stroke.active) {
      // Dome terms are a rate, so holding still keeps piling; the push term is
      // a distance already, and is consumed once for the drag that produced
      // it.
      const brush = brushRef.current;
      const tool = active.brushMode;
      const rate = active.brushStrength * Math.min(delta, 1 / 30);
      const force = active.brushStrength;
      brush.x = stroke.x;
      brush.z = stroke.z;
      brush.dx = stroke.dx;
      brush.dz = stroke.dz;
      brush.radius = active.brushRadius;
      // Defaulted rather than looked up bare: a gain a tool does not drive has
      // to come out zero, and an undefined one multiplies to NaN and writes
      // that straight into the bed buffer.
      brush.domeGain = (DOME_GAIN[tool] || 0) * rate;
      brush.pushGain = (PUSH_GAIN[tool] || 0) * force;
      brush.waterLift = (WATER_LIFT[tool] || 0) * rate;
      brush.waterPush = (WATER_PUSH[tool] || 0) * force;
      runtime.solver.sculpt(gl, brush);
      stroke.dx = 0;
      stroke.dz = 0;
    }

    const step = Math.min(delta, 1 / 30) * active.timeScale;
    applyGrainUniforms(runtime.uniforms, active);
    runtime.uniforms.dt.value = step;
    runtime.uniforms.phase.value += step;
    gl.compute(runtime.grainKernel);
  });

  if (!config.brushEnabled) return null;

  return (
    <BrushPlane
      field={field}
      resolution={resolution}
      strokeRef={strokeRef}
      worldSize={worldSize}
    />
  );
}

export default memo(GrainWater);
