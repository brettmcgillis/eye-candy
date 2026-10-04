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
  'src/dev/tools/trucheterie3d/components/OptionSections.jsx'
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
    const tubes = kernel.buildTubes(kernel.buildField(config), config);
    invariants(`roll check-${i}`, tubes, kernel.verifyTubes);
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
  const source = await readFile(PAGE_FIELDS, 'utf8');
  const block = source.match(/const HANDLED = new Set\(\[([^\]]+)\]/u)?.[1];
  check(block, 'OptionSections.jsx lost its HANDLED list.');
  [...(block ?? '').matchAll(/'(\w+)'/gu)].forEach(([, key]) =>
    check(
      key in RENDER_OPTIONS,
      `the workbench hand-lays "${key}", which is not in renderOptions.mjs.`
    )
  );
}

// The rig must compile to valid WGSL and draw something over the backdrop,
// grown and mid-growth.
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
    await headless.readFrame(() => renderer.render(scene, camera));
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
  rig.dispose();
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
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);

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
