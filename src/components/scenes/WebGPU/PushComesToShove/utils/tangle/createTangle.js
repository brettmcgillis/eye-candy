import { instancedArray, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_PER_CELL } from '../layout';
import { seedSpheres, seedWires } from './seedTangle';
import createSolve from './solveKernel';
import { createSpherePosition, createSphereVelocity } from './sphereKernels';
import {
  createClearGrid,
  createContact,
  createInsert,
  createIntegrate,
} from './wireKernels';

const SIM_KEYS = [
  'anchorDrift',
  'anchorSpeed',
  'bendStiffness',
  'collideStiffness',
  'damping',
  'growTime',
  'laneStiffness',
  'relaxation',
  'sphereDrive',
  'sphereResistance',
  'sphereSpeed',
  'writheScale',
  'writheSpeed',
  'writheStrength',
];

function createUniforms(layout) {
  const u = {
    cellSize: uniform(layout.cellSize),
    collideRadius: uniform(layout.collideRadius),
    dt: uniform(1 / 120),
    gridOrigin: uniform(new THREE.Vector3(...layout.gridOrigin)),
    laneRange: uniform(layout.fieldHalfHeight * 0.7),
    maxStep: uniform(layout.collideRadius * 0.5),
    phase: uniform(0),
    restLength: uniform(layout.restLength),
    sphereCount: uniform(0, 'uint'),
    zBack: uniform(layout.zBack),
    zFront: uniform(layout.zFront),
  };
  SIM_KEYS.forEach((key) => {
    u[key] = uniform(0);
  });
  return u;
}

export default function createTangle(config, layout) {
  const wires = seedWires(config, layout);
  const spheres = seedSpheres(config, layout);
  const sphereCount = Math.max(config.sphereCount, 1);
  const grid = { ...layout, maxPerCell: MAX_PER_CELL };

  const b = {
    anchors: instancedArray(wires.anchors, 'vec4'),
    bodies: instancedArray(spheres.bodies, 'vec4'),
    cellCount: instancedArray(layout.cellCount, 'uint').toAtomic(),
    cellItems: instancedArray(layout.cellCount * MAX_PER_CELL, 'uint'),
    lanes: instancedArray(spheres.lanes, 'vec4'),
    motion: instancedArray(spheres.motion, 'vec4'),
    pos: instancedArray(wires.positions, 'vec4'),
    posAlt: instancedArray(wires.positions.slice(), 'vec4'),
    prev: instancedArray(wires.positions.slice(), 'vec4'),
    reaction: instancedArray(sphereCount * 4, 'int').toAtomic(),
  };
  const u = createUniforms(layout);
  u.sphereCount.value = config.sphereCount;

  const kernels = {
    clearGrid: createClearGrid(b, grid),
    contact: createContact(b, u, grid),
    insert: createInsert(b, u, grid),
    integrate: createIntegrate(b, u, grid),
    solveForward: createSolve(b, u, grid, b.pos, b.posAlt),
    solveBack: createSolve(b, u, grid, b.posAlt, b.pos),
    spherePosition: createSpherePosition(b, u, layout, sphereCount),
    sphereVelocity: createSphereVelocity(b, u, sphereCount),
  };

  function sync(values) {
    SIM_KEYS.forEach((key) => {
      u[key].value = values[key];
    });
  }

  // Iterations run in forward/back pairs so the settled positions always land
  // back in `pos`, the buffer the tubes read.
  function step(renderer, values, delta) {
    const substeps = Math.max(1, values.substeps);
    const dt = (Math.min(delta, 1 / 30) * values.timeScale) / substeps;
    if (dt <= 0) return;
    u.dt.value = dt;
    const pairs = Math.max(1, Math.round(values.iterations / 2));
    for (let s = 0; s < substeps; s += 1) {
      u.phase.value += dt;
      const pass = [
        kernels.sphereVelocity,
        kernels.spherePosition,
        kernels.integrate,
        kernels.clearGrid,
        kernels.insert,
        kernels.contact,
      ];
      for (let i = 0; i < pairs; i += 1) {
        pass.push(kernels.solveForward, kernels.solveBack);
      }
      renderer.compute(pass);
    }
  }

  sync(config);

  return { buffers: b, kernels, layout, sphereCount, step, sync, uniforms: u };
}
