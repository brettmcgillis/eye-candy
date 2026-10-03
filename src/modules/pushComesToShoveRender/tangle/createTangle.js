import { instancedArray, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  MAX_PER_CELL,
  puckBackOf,
  seedCylinders,
  seedWires,
} from '@modules/pushComesToShove';

import {
  createCylinderPosition,
  createCylinderVelocity,
} from './cylinderKernels';
import createFrames from './frameKernel';
import createSolve from './solveKernel';
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
  'cylinderDrive',
  'cylinderResistance',
  'cylinderWander',
  'cylinderWanderSpeed',
  'damping',
  'relaxation',
  'wireSmoothing',
  'writheScale',
  'writheSpeed',
  'writheStrength',
];

function createUniforms(layout) {
  const u = {
    bendSpan: uniform(0),
    cellSize: uniform(layout.cellSize),
    collideRadius: uniform(layout.collideRadius),
    cylinderCount: uniform(0, 'uint'),
    dt: uniform(1 / 120),
    gridOrigin: uniform(new THREE.Vector3(...layout.gridOrigin)),
    maxStep: uniform(layout.collideRadius * 0.5),
    phase: uniform(0),
    puckBack: uniform(layout.zBack),
    restLength: uniform(layout.restLength),
    zBack: uniform(layout.zBack),
    zFront: uniform(layout.zFront),
  };
  SIM_KEYS.forEach((key) => {
    u[key] = uniform(0);
  });
  return u;
}

export default function createTangle(config, layout) {
  const cylinders = seedCylinders(config, layout);
  const wires = seedWires(config, layout, cylinders.placed);
  const cylinderCount = Math.max(config.cylinderCount, 1);
  const grid = { ...layout, maxPerCell: MAX_PER_CELL };

  const b = {
    anchors: instancedArray(wires.anchors, 'vec4'),
    bodies: instancedArray(cylinders.bodies, 'vec4'),
    cellCount: instancedArray(layout.cellCount, 'uint').toAtomic(),
    cellItems: instancedArray(layout.cellCount * MAX_PER_CELL, 'uint'),
    frame: instancedArray(layout.pointCount, 'vec4'),
    lanes: instancedArray(cylinders.lanes, 'vec4'),
    motion: instancedArray(cylinders.motion, 'vec4'),
    pos: instancedArray(wires.positions, 'vec4'),
    posAlt: instancedArray(wires.positions.slice(), 'vec4'),
    prev: instancedArray(wires.positions.slice(), 'vec4'),
    reaction: instancedArray(cylinderCount * 4, 'int').toAtomic(),
    render: instancedArray(wires.positions.slice(), 'vec4'),
  };
  const u = createUniforms(layout);
  u.cylinderCount.value = config.cylinderCount;

  const kernels = {
    clearGrid: createClearGrid(b, grid),
    contact: createContact(b, u, grid),
    cylinderPosition: createCylinderPosition(b, u, cylinderCount),
    cylinderVelocity: createCylinderVelocity(b, u, cylinderCount),
    frames: createFrames(b, u, layout),
    insert: createInsert(b, u, grid),
    integrate: createIntegrate(b, u, grid),
    solveForward: createSolve(b, u, grid, b.pos, b.posAlt),
    solveBack: createSolve(b, u, grid, b.posAlt, b.pos),
  };

  function sync(values) {
    SIM_KEYS.forEach((key) => {
      u[key].value = values[key];
    });
    const joint =
      layout.restLength / (values.bendRadius * layout.collideRadius);
    u.bendSpan.value =
      joint < Math.PI ? 2 * layout.restLength * Math.cos(joint * 0.5) : 0;
    u.puckBack.value = puckBackOf(values, layout);
  }

  // Iterations run in forward/back pairs so the settled positions always land
  // back in `pos`, which the frame pass smooths into `render` for the tubes.
  function simulate(renderer, values, substeps, dt) {
    u.dt.value = dt;
    const pairs = Math.max(1, Math.round(values.iterations / 2));
    for (let s = 0; s < substeps; s += 1) {
      u.phase.value += dt;
      const pass = [
        kernels.cylinderVelocity,
        kernels.cylinderPosition,
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

  function step(renderer, values, delta) {
    const substeps = Math.max(1, values.substeps);
    const dt = (Math.min(delta, 1 / 30) * values.timeScale) / substeps;
    if (dt > 0) simulate(renderer, values, substeps, dt);
    renderer.compute(kernels.frames);
  }

  sync(config);

  return {
    buffers: b,
    cylinderCount,
    kernels,
    layout,
    step,
    sync,
    uniforms: u,
  };
}
