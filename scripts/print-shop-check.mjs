#!/usr/bin/env node
// Drift checks for PrintShop: the CPU cloth mirror still steps like the GPU
// sim, every printable's default print is a closed solid, and every writer
// emits a file its format's readers accept.
import process from 'node:process';

import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules from './lib/loadModules.mjs';
import { loadPrintShop, printEnv } from './lib/printShop.mjs';

const failures = [];
const check = (ok, message) => {
  process.stdout.write(`${ok ? '  ok  ' : '  FAIL'} ${message}\n`);
  if (!ok) failures.push(message);
};

// Five frames is long enough to exercise anchors, colliders and the wind
// noise, and short enough that f32-vs-f64 rounding has not grown chaotic.
async function checkClothMirror() {
  const { THREE } = await loadThree();
  const CLOTH =
    '/src/components/elements/WebGPU/cloth/createClothSimulation.js';
  const CPU = '/src/components/elements/WebGPU/cloth/clothCpu.js';
  const TOPOLOGY = '/src/components/elements/WebGPU/cloth/clothTopology.js';
  const RIG = '/src/components/elements/WebGPU/ghost/ghostRig.js';
  const GHOST = '/src/dev/tools/printShop/printables/ghost/printable.js';
  const m = await loadModules([CLOTH, CPU, TOPOLOGY, RIG, GHOST]);
  const rig = m[RIG];
  const p = m[GHOST].variantParams('Damage@93%');
  const { renderer } = await createHeadlessRenderer({ height: 16, width: 16 });
  // eslint-disable-next-line no-underscore-dangle
  const { nodeFrame } = renderer._nodes;

  const vec = ({ x, y, z }) => new THREE.Vector3(x, y, z);
  const makeRig = () => {
    const head = vec(rig.headCentre());
    const hands = rig.handRest(p);
    const left = vec(hands.left);
    const right = vec(hands.right);
    const ears = rig.earAnchorPositions(p);
    return {
      anchors: rig.ghostAnchors(p, {
        earLeft: vec(ears.left),
        earRight: vec(ears.right),
        handLeft: left,
        handRight: right,
        head,
      }),
      colliders: rig.ghostColliders(p, {
        handLeft: left,
        handRight: right,
        head,
      }),
      hands: { left, right },
      state: rig.createGhostRigState(),
    };
  };
  const gpuRig = makeRig();
  const cpuRig = makeRig();
  const segments = p.clothSegments;
  const config = {
    centered: true,
    height: 1,
    orientation: 'horizontal',
    pins: rig.ghostPins(segments, segments),
    segmentsX: segments,
    segmentsY: segments,
    shape: 'circle',
    width: 1,
  };
  const alpha = {
    edgeFade: p.edgeFade,
    holeAmount: p.holeAmount,
    scale: p.alphaScale,
    seed: p.alphaSeed,
    tatterEdge: p.tatterEdge,
  };
  const sim = m[CLOTH].default({
    ...config,
    alpha,
    anchors: gpuRig.anchors,
    gravity: p.gravity,
    material: new THREE.MeshPhysicalNodeMaterial(),
    windAmplitude: p.windAmplitude,
  });
  const topology = m[TOPOLOGY].buildClothTopology({
    ...config,
    anchors: cpuRig.anchors,
  });
  const cpu = m[CPU].default(topology, {
    alpha: m[TOPOLOGY].computeClothAlpha(topology, alpha).alpha,
  });

  for (let f = 0; f < 5; f += 1) {
    const frame = rig.stepGhostRig(gpuRig.state, 1 / 60, {}, p, gpuRig.hands);
    rig.stepGhostRig(cpuRig.state, 1 / 60, {}, p, cpuRig.hands);
    const ca = Math.cos(frame.rotationX);
    const down = [
      -Math.sin(frame.rotationZ) * ca,
      -Math.cos(frame.rotationZ) * ca,
      Math.sin(frame.rotationX),
    ];
    sim.stiffnessU.value = p.stiffness;
    sim.dampeningU.value = p.dampening;
    sim.maxVelocityU.value = p.maxVelocity;
    sim.collisionMarginU.value = p.collisionMargin;
    sim.gravityU.value = p.gravity * frame.gravityScale;
    sim.windU.value = frame.windStrength;
    sim.windDirU.value.set(...(frame.windDir ?? [1, 0, 0]));
    sim.gravityDirU.value.set(...down);
    sim.colliderEnabledU[0].value = 0;
    for (let c = 1; c < sim.NUM_COLLIDERS; c += 1) {
      const collider = gpuRig.colliders[c - 1];
      sim.colliderEnabledU[c].value = collider ? 1 : 0;
      if (collider) {
        sim.colliderPosU[c].value.copy(collider.position);
        sim.colliderRadiusU[c].value = collider.radius;
      }
    }
    gpuRig.anchors.forEach((anchor, a) => {
      sim.anchorPosU[a].value.copy(anchor.position);
    });
    nodeFrame.time = f / 60;
    const state = {
      anchors: cpuRig.anchors.map(({ position }) => [
        position.x,
        position.y,
        position.z,
      ]),
      collisionMargin: p.collisionMargin,
      colliders: cpuRig.colliders.map(({ position, radius }) => ({
        radius,
        x: position.x,
        y: position.y,
        z: position.z,
      })),
      dampening: p.dampening,
      gravity: p.gravity * frame.gravityScale,
      gravityDir: down,
      maxVelocity: p.maxVelocity,
      stiffness: p.stiffness,
      time: f / 60,
      wind: frame.windStrength,
      windAmplitude: p.windAmplitude,
      windDir: frame.windDir ?? [1, 0, 0],
    };
    for (let s = 0; s < 6; s += 1) {
      // eslint-disable-next-line no-await-in-loop
      await renderer.computeAsync(sim.computeSprings);
      // eslint-disable-next-line no-await-in-loop
      await renderer.computeAsync(sim.computeVertices);
      cpu.step(state);
    }
  }
  const gpu = new Float32Array(
    await renderer.getArrayBufferAsync(sim.posBuf.value)
  );
  const stride = gpu.length / topology.vCount;
  let worst = 0;
  for (let v = 0; v < topology.vCount; v += 1) {
    for (let k = 0; k < 3; k += 1) {
      worst = Math.max(
        worst,
        Math.abs(gpu[v * stride + k] - cpu.pos[v * 3 + k])
      );
    }
  }
  check(
    worst < 1e-5,
    `CPU cloth mirror tracks the GPU sim (worst ${worst.toExponential(2)} after 5 frames)`
  );
}

const CASES = [
  { mount: 'none' },
  { mount: 'base' },
  {
    mount: 'base',
    signature: 'bret',
    signaturePlace: 'both',
    standJoin: 'removable',
  },
  {
    mount: 'base',
    signature: 'argyle',
    signaturePlace: 'both',
    standJoin: 'fused',
  },
  {
    mount: 'hem',
    signature: 'reversal',
    signaturePlace: 'piece',
    signatureStyle: 'emboss',
  },
  { mount: 'loop' },
];

async function checkPrintables() {
  const shop = await loadPrintShop();
  const env = await printEnv();
  const { PRINTABLES, WRITERS, assemblePrint, schemaFor, seatModel } = shop;
  check(PRINTABLES.length > 0, `${PRINTABLES.length} printable(s) registered`);
  // eslint-disable-next-line no-restricted-syntax
  for (const printable of PRINTABLES) {
    const schema = schemaFor(printable.id);
    // eslint-disable-next-line no-restricted-syntax
    for (const sent of CASES) {
      const options = schema.normalizeOptions('export', sent);
      // eslint-disable-next-line no-await-in-loop
      const { bodies, report } = await assemblePrint(printable, options, env);
      const label = `${printable.id} ${JSON.stringify(sent)}`;
      const expected =
        options.mount === 'base' && options.standJoin === 'removable' ? 2 : 1;
      check(
        bodies.length === expected,
        `${label}: ${bodies.length} body/bodies`
      );
      report.bodies.forEach(({ analysis, label: body }) => {
        check(
          analysis.watertight && analysis.shells === 1 && analysis.volume > 0,
          `${label} ${body}: watertight, one shell, ${analysis.volumeCm3.toFixed(1)} cm³`
        );
      });
      if (options.mount === 'hem')
        check(report.stability?.stable, `${label}: stands on its hem`);
      if (sent.mount === 'none') {
        const model = seatModel(bodies[0].model);
        const stl = WRITERS.stl.write(model, { title: printable.id });
        const view = new DataView(stl.buffer);
        check(
          stl.length === 84 + view.getUint32(80, true) * 50,
          'STL size matches its triangle count'
        );
        const tmf = WRITERS['3mf'].write(model, { title: printable.id });
        check(
          new DataView(tmf.buffer).getUint32(0, true) === 0x04034b50,
          '3MF is a zip package'
        );
        const glb = WRITERS.glb.write(model, { title: printable.id });
        const glbView = new DataView(glb.buffer);
        check(
          glbView.getUint32(0, true) === 0x46546c67 &&
            glbView.getUint32(8, true) === glb.length,
          'GLB header and length agree'
        );
        const thumb = shop.renderThumbnail(bodies, { height: 64, width: 64 });
        let drawn = 0;
        for (let i = 0; i < thumb.data.length; i += 4) {
          if (thumb.data[i] !== thumb.data[0]) drawn += 1;
        }
        check(drawn > 200, `thumbnail draws the piece (${drawn} px)`);
      }
    }
  }
}
process.stdout.write('PrintShop check\n');
await checkClothMirror();
await checkPrintables();
process.stdout.write(
  failures.length
    ? `${failures.length} check(s) failed\n`
    : 'all checks passed\n'
);
process.exit(failures.length ? 1 : 0);
