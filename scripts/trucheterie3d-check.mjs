#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm and invariant check for the Trucheterie3D pipeline: the scene,
// the CLIs and the workbench must agree with the kernel they share; every
// strand/junction/height mode must keep the printability invariants (no two
// tubes intersect, every chain a loop or capped); and the rig must compile
// and draw. See docs/trucheterie3d-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/trucheterie3d/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'trucheterie3d');
const PRESETS =
  '/src/components/scenes/WebGPU/Trucheterie3D/presets/presets.js';
const HEADLESS = [
  'lib/trucheterie3dRender.mjs',
  'trucheterie3d-generate.mjs',
  'trucheterie3d-video.mjs',
];
const BARRELS = {
  blob: '/src/modules/trucheterieBlob/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/trucheterie3dRender/index.js',
  tubes: '/src/modules/trucheterie3d/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/trucheterie3d/Trucheterie3DWorkbenchPage.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set(['@modules/trucheterieBlob']);
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const SEEDS = ['blob-1', 'coil-77', 'weft-3'];
const MODES = [
  { junction: 'cap', strands: 'lanes', tubeThickness: 1 },
  { junction: 'cap', strands: 'wires' },
  { junction: 'cap', strands: 'both', heightMode: 'terrace', heightScale: 0.5 },
  { junction: 'weave', strands: 'lanes', tubeThickness: 1 },
  {
    junction: 'weave',
    strands: 'both',
    heightMode: 'terrace',
    heightScale: 0.5,
  },
  { blobPathsPerUnit: 5, junction: 'cap', strands: 'both' },
];
const MIN_SILHOUETTE_IOU = 0.9;
const MEMBRANE_MODES = [
  { strands: 'lanes' },
  { strands: 'both', junction: 'weave', heightMode: 'terrace' },
  { blobPathsPerUnit: 4, membraneRows: 2, strands: 'lanes' },
  { membraneSides: 'double', strands: 'both' },
];
const MIN_MEMBRANE_IOU = 0.99;
const MAX_FLIPPED_SHARE = 0.001;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function checkKernelPurity() {
  const files = (await readdir(KERNEL_DIR)).filter((name) =>
    /\.(js|mjs)$/u.test(name)
  );
  await Promise.all(
    files.map(async (name) => {
      const source = await readFile(path.join(KERNEL_DIR, name), 'utf8');
      [...source.matchAll(/from '([^'.][^']*)'/gu)]
        .map(([, specifier]) => specifier)
        .filter((specifier) => !ALLOWED_KERNEL_IMPORTS.has(specifier))
        .forEach((specifier) =>
          failures.push(
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/trucheterie3dRender.`
          )
        );
    })
  );
}

function checkRigDefaults({ lights, look }) {
  const { slots } = lights.buildSceneLightingRuntimeConfig({
    lighting: look.TRUCHETERIE3D_LIGHTING,
  });
  const key = slots.find((slot) => slot.id === 'key');
  const fill = slots.find((slot) => slot.id === 'fill');
  const expected = {
    lightFillIntensity: fill?.intensity,
    lightKeyAzimuth: key?.spherical?.azimuth,
    lightKeyColor: key?.color,
    lightKeyElevation: key?.spherical?.elevation,
    lightKeyIntensity: key?.intensity,
  };
  Object.entries(RENDER_OPTIONS)
    .filter(([, spec]) => spec.rig)
    .forEach(([name, spec]) => {
      check(
        name in expected,
        `"${name}" is a rig key the check does not know how to verify.`
      );
      check(
        spec.default === expected[name],
        `"${name}" defaults to ${spec.default} in renderOptions.mjs but the rig declares ${expected[name]}.`
      );
    });
}

// Leva keeps a value a preset leaves out, so a hand-written preset that
// skips a control inherits it from whichever preset was showing before.
function checkPresets({ PRESETS: presets }, palettes) {
  const scene = new Set(SCENE_KEYS);
  Object.entries(presets).forEach(([name, preset]) => {
    Object.keys(preset)
      .filter((key) => !scene.has(key) && !CAMERA_KEY.test(key))
      .forEach((key) =>
        failures.push(
          `preset "${name}" sets "${key}", which renderOptions.mjs does not declare.`
        )
      );
    LEVA_KEYS.filter((key) => !(key in preset)).forEach((key) =>
      failures.push(`preset "${name}" leaves out "${key}".`)
    );
    Object.entries(preset).forEach(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      if (spec?.type === 'number') {
        check(
          value >= spec.min && value <= spec.max,
          `preset "${name}" sets ${key} = ${value}, outside [${spec.min}, ${spec.max}] — Leva would clamp it.`
        );
      }
      if (spec?.type === 'enum') {
        check(
          spec.choices.includes(value),
          `preset "${name}" sets ${key} = "${value}", not one of its choices.`
        );
      }
    });
    check(
      palettes.includes(preset.blobPalette),
      `preset "${name}" names palette "${preset.blobPalette}", which gradients.json does not have.`
    );
  });
}

function invariants(label, tubes, verify) {
  const result = verify(tubes);
  check(
    result.violations === 0,
    `${label}: ${result.violations} tube intersections (worst ${result.worst.toFixed(3)} lane widths).`
  );
  check(
    result.unterminated === 0,
    `${label}: ${result.unterminated} chains too short to carry their caps.`
  );
  check(tubes.chains.length > 0, `${label}: no tubes at all.`);
}

function checkModes({ tubes: kernel }) {
  SEEDS.forEach((seed) =>
    MODES.forEach((mode) => {
      const config = { ...kernel.sceneDefaults(), blobSeed: seed, ...mode };
      const tubes = kernel.buildTubes(kernel.buildField(config), config);
      invariants(`${seed} ${JSON.stringify(mode)}`, tubes, kernel.verifyTubes);
    })
  );
}

function checkRolls({ tubes: kernel }, paletteNames) {
  for (let i = 0; i < 8; i += 1) {
    const config = kernel.rollTubeConfig(`check-${i}`, { paletteNames });
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
    const form = kernel.buildForm(kernel.buildField(config), config);
    if (form.tubes.chains.length > 0) {
      invariants(`roll check-${i}`, form.tubes, kernel.verifyTubes);
    }
    check(
      !kernel.membraneActive(config) || form.membrane?.stats.vertices > 0,
      `roll check-${i} asks for a membrane and builds none.`
    );
  }
  const source = kernel.rollTubeConfig('b', { paletteNames });
  const held = kernel.rollTubeConfig('a', {
    base: source,
    keep: ['structure'],
    paletteNames,
  });
  kernel
    .keysInFacet('structure')
    .forEach((key) =>
      check(
        held[key] === source[key],
        `holding structure still re-rolled "${key}".`
      )
    );
}

// Flat Cap lanes at full width are the 2D drawing extruded: from above,
// their footprint should cover the same ground as the 2D blob silhouette.
function checkSilhouette({ blob, tubes: kernel }) {
  const config = {
    ...kernel.sceneDefaults(),
    blobSeed: 'blob-1',
    junction: 'cap',
    strands: 'lanes',
    tubeThickness: 1,
  };
  const field = kernel.buildField(config);
  const tubes = kernel.buildTubes(field, config);
  const grid = tubes.gridSize;
  const steps = 360;
  const cellOf = new Int32Array(grid * grid).fill(-1);
  field.cells.forEach(({ cell }, index) => {
    for (let c = cell.column; c < cell.column + cell.size; c += 1) {
      for (let r = cell.row; r < cell.row + cell.size; r += 1) {
        cellOf[r * grid + c] = index;
      }
    }
  });
  const inBlob = (x, y) => {
    const index = cellOf[Math.floor(y) * grid + Math.floor(x)];
    if (index == null || index < 0) return false;
    const { cell, connections } = field.cells[index];
    return connections.some(([type, edge]) => {
      const sector = blob.familySector(cell, type, edge);
      return Math.hypot(x - sector.x, y - sector.y) <= sector.rMax;
    });
  };
  const covered = new Uint8Array(steps * steps);
  const unit = grid / steps;
  tubes.chains.forEach((chain) => {
    for (let k = 0; k < chain.points.length; k += 3) {
      const r = chain.radii[k / 3];
      const px = chain.points[k];
      const py = chain.points[k + 1];
      const x0 = Math.max(0, Math.floor((px - r) / unit));
      const x1 = Math.min(steps - 1, Math.ceil((px + r) / unit));
      const y0 = Math.max(0, Math.floor((py - r) / unit));
      const y1 = Math.min(steps - 1, Math.ceil((py + r) / unit));
      for (let gy = y0; gy <= y1; gy += 1) {
        for (let gx = x0; gx <= x1; gx += 1) {
          const cx = (gx + 0.5) * unit;
          const cy = (gy + 0.5) * unit;
          if (Math.hypot(cx - px, cy - py) <= r) covered[gy * steps + gx] = 1;
        }
      }
    }
  });
  let both = 0;
  let either = 0;
  for (let gy = 0; gy < steps; gy += 1) {
    for (let gx = 0; gx < steps; gx += 1) {
      const a = inBlob((gx + 0.5) * unit, (gy + 0.5) * unit);
      const b = covered[gy * steps + gx] === 1;
      if (a && b) both += 1;
      if (a || b) either += 1;
    }
  }
  const iou = either > 0 ? both / either : 0;
  check(
    iou >= MIN_SILHOUETTE_IOU,
    `flat Cap lanes cover the 2D silhouette at IoU ${iou.toFixed(3)}, under ${MIN_SILHOUETTE_IOU}.`
  );
}

// The 2D lanes' ground, per grid point: inside a family's sector and, for
// a second family, outside the first's disc.
function lanesCover(blob, field, x, y) {
  return field.cells.some(({ cell, connections }) => {
    if (
      x < cell.column ||
      y < cell.row ||
      x >= cell.column + cell.size ||
      y >= cell.row + cell.size
    ) {
      return false;
    }
    const occluder =
      connections.length > 1
        ? blob.familySector(cell, connections[0][0], connections[0][1])
        : null;
    return connections.some(([type, edge], slot) => {
      const sector = blob.familySector(cell, type, edge);
      if (Math.hypot(x - sector.x, y - sector.y) > sector.rMax) return false;
      return (
        slot === 0 || Math.hypot(x - occluder.x, y - occluder.y) > occluder.rMax
      );
    });
  });
}

// A membrane is the 2D lanes' ground exactly, stitched in strips that all
// wind one way, with every strip edge on a seam; any wires it carries keep
// the tube invariants.
function checkMembrane({ blob, tubes: kernel }) {
  SEEDS.forEach((seed) =>
    MEMBRANE_MODES.forEach((mode) => {
      const label = `${seed} membrane ${JSON.stringify(mode)}`;
      const config = {
        ...kernel.sceneDefaults(),
        blobSeed: seed,
        lanesAs: 'membrane',
        ...mode,
      };
      const field = kernel.buildField(config);
      const { membrane, tubes } = kernel.buildForm(field, config);
      if (config.strands === 'both') {
        invariants(`${label} wires`, tubes, kernel.verifyTubes);
      }
      const { index, rest } = membrane;
      let flipped = 0;
      for (let t = 0; t < index.length; t += 3) {
        const [a, b, c] = [index[t], index[t + 1], index[t + 2]];
        const area =
          (rest[b * 2] - rest[a * 2]) * (rest[c * 2 + 1] - rest[a * 2 + 1]) -
          (rest[b * 2 + 1] - rest[a * 2 + 1]) * (rest[c * 2] - rest[a * 2]);
        if (area > 1e-9) flipped += 1;
      }
      const share = flipped / (index.length / 3);
      check(
        share <= MAX_FLIPPED_SHARE,
        `${label}: ${flipped} triangles fold back (${(share * 100).toFixed(2)}%).`
      );
      const { rows, strips } = membrane;
      const welded = new Set(membrane.weldMembers);
      let looseEdges = 0;
      for (let s = 0; s < strips.length / 4; s += 1) {
        const base = strips[s * 4];
        const cols = strips[s * 4 + 1];
        for (let c = 0; c < cols; c += 1) {
          for (let k = 0; k < rows; k += rows - 1) {
            const v = base + c * rows + k;
            if (!membrane.pinned[v] && !welded.has(v)) looseEdges += 1;
          }
        }
      }
      check(
        looseEdges === 0,
        `${label}: ${looseEdges} strip-edge vertices are neither on a seam nor a welded centre.`
      );
      if (seed !== SEEDS[0]) return;

      const grid = membrane.gridSize;
      const steps = 480;
      const unit = grid / steps;
      const covered = new Uint8Array(steps * steps);
      for (let t = 0; t < index.length; t += 3) {
        const p = [0, 1, 2].map((i) => [
          rest[index[t + i] * 2] / unit,
          rest[index[t + i] * 2 + 1] / unit,
        ]);
        const edge = (u, w, x, y) =>
          (w[0] - u[0]) * (y - u[1]) - (w[1] - u[1]) * (x - u[0]);
        const xs = p.map(([x]) => x);
        const ys = p.map(([, y]) => y);
        for (
          let gy = Math.max(0, Math.floor(Math.min(...ys)));
          gy <= Math.min(steps - 1, Math.ceil(Math.max(...ys)));
          gy += 1
        ) {
          for (
            let gx = Math.max(0, Math.floor(Math.min(...xs)));
            gx <= Math.min(steps - 1, Math.ceil(Math.max(...xs)));
            gx += 1
          ) {
            const e = [
              edge(p[0], p[1], gx + 0.5, gy + 0.5),
              edge(p[1], p[2], gx + 0.5, gy + 0.5),
              edge(p[2], p[0], gx + 0.5, gy + 0.5),
            ];
            if (e.every((w) => w >= 0) || e.every((w) => w <= 0)) {
              covered[gy * steps + gx] = 1;
            }
          }
        }
      }
      let both = 0;
      let either = 0;
      for (let gy = 0; gy < steps; gy += 1) {
        for (let gx = 0; gx < steps; gx += 1) {
          const a = lanesCover(
            blob,
            field,
            (gx + 0.5) * unit,
            (gy + 0.5) * unit
          );
          const b = covered[gy * steps + gx] === 1;
          if (a && b) both += 1;
          if (a || b) either += 1;
        }
      }
      const iou = either > 0 ? both / either : 0;
      check(
        iou >= MIN_MEMBRANE_IOU,
        `${label}: the skin covers the 2D lanes at IoU ${iou.toFixed(4)}, under ${MIN_MEMBRANE_IOU}.`
      );
    })
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(tubes|look|lights)\.(\w+)/gu)]
        .filter(([, barrel]) => barrel in barrels)
        .forEach(([, barrel, name]) =>
          check(
            name in barrels[barrel],
            `${file} calls ${barrel}.${name}, which ${BARRELS[barrel]} does not export.`
          )
        );
    })
  );
}

async function checkPageFields() {
  await checkWorkbenchPage(PAGE_FIELDS, RENDER_OPTIONS, check);
}

// The rig must compile to valid WGSL and draw something over the backdrop,
// grown, mid-growth, and as an inflated membrane.
async function checkRender({ lights, look, tubes: kernel }, THREE) {
  const size = 128;
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.shadowMap.enabled = true;
      /* eslint-enable no-param-reassign */
    },
    height: size,
    width: size,
  });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 12, 12);
  camera.lookAt(0, 0, 0);
  const rig = look.createTubeRig();
  scene.add(rig.group);
  const config = {
    ...kernel.sceneDefaults(),
    blobSeed: 'blob-1',
    floorEnabled: false,
    strands: 'both',
    tubeProfile: 'half',
  };
  const field = kernel.buildField(config);
  rig.setTubes({ config, field, tubes: kernel.buildTubes(field, config) });
  rig.updateEnvironment(renderer, scene, config);
  scene.add(
    lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        lighting: look.TRUCHETERIE3D_LIGHTING,
      })
    )
  );
  const { device } = renderer.backend;
  const litPixels = async () => {
    device.pushErrorScope('validation');
    const frame = await headless.readFrame(() =>
      renderer.render(scene, camera)
    );
    const error = await device.popErrorScope();
    check(!error, `the rig fails validation: ${error?.message}`);
    let lit = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 12) lit += 1;
    }
    return lit;
  };
  const grown = await litPixels();
  check(grown > size * size * 0.1, 'the default field draws almost nothing.');
  rig.setGrowth(0.3);
  const growing = await litPixels();
  check(
    growing > 0 && growing < grown,
    `mid-growth should draw some of the field (drew ${growing} of ${grown} pixels).`
  );

  const skin = {
    ...config,
    lanesAs: 'membrane',
    strands: 'lanes',
  };
  rig.setTubes({ config: skin, field, ...kernel.buildForm(field, skin) });
  for (let f = 0; f < 60; f += 1) {
    rig.stepMembrane(renderer, 1 / 30, skin, skin.membranePressure);
  }
  const inflated = await litPixels();
  check(
    inflated > size * size * 0.1,
    `the membrane draws almost nothing (${inflated} pixels).`
  );
  const balloon = { ...skin, membraneSides: 'double' };
  rig.setTubes({ config: balloon, field, ...kernel.buildForm(field, balloon) });
  for (let f = 0; f < 30; f += 1) {
    rig.stepMembrane(renderer, 1 / 30, balloon, balloon.membranePressure);
  }
  const ballooned = await litPixels();
  check(
    ballooned > size * size * 0.1,
    `the balloon membrane draws almost nothing (${ballooned} pixels).`
  );
  const finishes = RENDER_OPTIONS.membraneFinish.choices;
  for (let f = 0; f < finishes.length; f += 1) {
    const dressed = {
      ...skin,
      membraneFinish: finishes[f],
      membraneSubdivision: f % 3,
    };
    rig.apply(dressed);
    rig.stepMembrane(renderer, 1 / 30, dressed, dressed.membranePressure);
    // eslint-disable-next-line no-await-in-loop
    const lit = await litPixels();
    check(
      lit > size * size * 0.1,
      `the ${finishes[f]} membrane at subdivision ${f % 3} draws almost nothing (${lit} pixels).`
    );
  }
  rig.dispose();
  headless.dispose();
}

// The solve itself, read back: inflating lifts every lane off the ground
// with the seams held, welded centres stay one point, nothing blows up,
// and with the pressure off the skin settles back toward flat.
async function checkMembraneSolve({ look, tubes: kernel }) {
  const headless = await createHeadlessRenderer({ height: 8, width: 8 });
  const { renderer } = headless;
  const config = {
    ...kernel.sceneDefaults(),
    blobPathsPerUnit: 3,
    blobSeed: 'blob-1',
    lanesAs: 'membrane',
  };
  const { membrane } = kernel.buildForm(kernel.buildField(config), config);
  const solver = look.createMembraneSolver(membrane);
  const read = async () =>
    new Float32Array(
      await renderer.getArrayBufferAsync(solver.positions.value)
    );
  const run = (seconds, target) => {
    for (let t = 0; t < seconds; t += 1 / 30) {
      solver.step(renderer, 1 / 30, config, target);
    }
  };
  const summarise = (p) => {
    let peak = 0;
    let finite = true;
    let drift = 0;
    for (let v = 0; v < solver.count; v += 1) {
      const [x, y, z] = [p[v * 4], p[v * 4 + 1], p[v * 4 + 2]];
      finite = finite && Number.isFinite(x + y + z);
      if (membrane.pinned[v]) {
        drift = Math.max(
          drift,
          Math.abs(z),
          Math.abs(x - membrane.rest[v * 2] / membrane.pitch),
          Math.abs(y - membrane.rest[v * 2 + 1] / membrane.pitch)
        );
      } else {
        peak = Math.max(peak, z);
      }
    }
    return { drift, finite, peak };
  };

  run(4, config.membranePressure);
  const p = await read();
  const up = summarise(p);
  check(up.finite, 'the membrane solve produced non-finite positions.');
  check(up.drift < 1e-4, `pinned seams moved ${up.drift} lane widths.`);
  check(
    up.peak > 0.15 && up.peak < 2,
    `inflated lanes peak at ${up.peak.toFixed(3)} lane widths, outside 0.15–2.`
  );
  let split = 0;
  const { weldGroups, weldMembers } = membrane;
  for (let g = 0; g < weldGroups.length / 2; g += 1) {
    const [first, n] = [weldGroups[g * 2], weldGroups[g * 2 + 1]];
    const lead = weldMembers[first];
    for (let m = first + 1; m < first + n; m += 1) {
      const v = weldMembers[m];
      for (let a = 0; a < 3; a += 1) {
        split = Math.max(split, Math.abs(p[v * 4 + a] - p[lead * 4 + a]));
      }
    }
  }
  check(split < 1e-4, `welded centres drift ${split} lane widths apart.`);

  run(8, 0);
  const down = summarise(await read());
  check(
    down.peak < up.peak * 0.25,
    `with the pressure off the skin only fell from ${up.peak.toFixed(3)} to ${down.peak.toFixed(3)}.`
  );
  solver.dispose();

  // A balloon: both skins inflate apart under normal pressure, the seams
  // hold, and neither skin crosses the plane they are sewn on.
  const balloon = {
    ...config,
    membranePressureMode: 'normal',
    membraneSides: 'double',
  };
  const sewn = kernel.buildForm(kernel.buildField(balloon), balloon).membrane;
  const pair = look.createMembraneSolver(sewn);
  for (let t = 0; t < 4; t += 1 / 30) {
    pair.step(renderer, 1 / 30, balloon, balloon.membranePressure);
  }
  const q = new Float32Array(
    await renderer.getArrayBufferAsync(pair.positions.value)
  );
  let top = 0;
  let bottom = 0;
  let crossed = 0;
  let seams = 0;
  for (let v = 0; v < pair.count; v += 1) {
    const z = q[v * 4 + 2];
    const side = sewn.side[v] ? -1 : 1;
    if (sewn.pinned[v]) seams = Math.max(seams, Math.abs(z));
    else if (side > 0) top = Math.max(top, z);
    else bottom = Math.min(bottom, z);
    if (z * side < -1e-6) crossed += 1;
  }
  check(
    top > 0.15 && bottom < -0.15,
    `a balloon inflates to ${top.toFixed(3)} / ${bottom.toFixed(3)} lane widths; both skins should clear 0.15.`
  );
  check(seams < 1e-4, `a balloon's seams moved ${seams} lane widths.`);
  check(
    crossed === 0,
    `${crossed} balloon vertices crossed to the other skin.`
  );
  pair.dispose();
  headless.dispose();
}

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  const { THREE } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  const palettes = barrels.look.PALETTE_NAMES;
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS], palettes);
  checkModes(barrels);
  checkRolls(
    barrels,
    palettes.filter((name) => name !== 'None')
  );
  checkSilhouette(barrels);
  checkMembrane(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);
  await checkMembraneSolve(barrels);

  if (failures.length > 0) {
    console.error(`trucheterie3d:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'trucheterie3d:check — kernel invariants, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
