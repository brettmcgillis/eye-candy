#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the SubdivisionRelief pipeline: the relief schema must keep
// Subdivision's piece options as they are, the scene's presets and every roll
// must be configs it accepts, the cells must be laid out and framed, and the
// rig must compile and draw on every lattice. The shared kernel's invariants
// live in subdivision:check. See docs/subdivision-relief-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { RENDER_OPTIONS as PIECE_OPTIONS } from '../src/modules/subdivision/renderOptions.mjs';
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/subdivisionRelief/renderOptions.mjs';
import { createHeadlessRenderer } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import { loadKernel } from './lib/subdivisionReliefRender.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src/modules/subdivisionRelief');
const PRESETS =
  '/src/components/scenes/WebGPU/SubdivisionRelief/presets/presets.js';
const HEADLESS = [
  'lib/subdivisionReliefRender.mjs',
  'subdivision-relief-generate.mjs',
  'subdivision-relief-video.mjs',
];
const PAGE = path.join(
  REPO_ROOT,
  'src/dev/tools/subdivisionRelief/SubdivisionReliefWorkbenchPage.jsx'
);
// What the relief may change about a Subdivision option.
const RESHAPED = new Set(['section', 'when', 'help']);
const CANVAS = { height: 500, width: 800 };

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function checkThreeFree() {
  const files = (await readdir(KERNEL_DIR)).filter((f) => /\.m?js$/u.test(f));
  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(KERNEL_DIR, file), 'utf8');
      check(
        !/from '(three|react|leva)[/']/u.test(source) &&
          !/@utils\/gradientPalette/u.test(source),
        `${file} imports three, React, Leva or gradientPalette; the kernel is three-free.`
      );
    })
  );
}

// A piece option keeps Subdivision's range and default, so a piece rolled or
// saved by one tool means the same thing in the other.
function checkSharedSpecs() {
  Object.entries(RENDER_OPTIONS)
    .filter(([key]) => key in PIECE_OPTIONS && RENDER_OPTIONS[key].scene)
    .forEach(([key, spec]) => {
      const flat = PIECE_OPTIONS[key];
      Object.keys({ ...flat, ...spec })
        .filter((field) => !RESHAPED.has(field))
        .forEach((field) =>
          check(
            JSON.stringify(spec[field]) === JSON.stringify(flat[field]),
            `"${key}".${field} is ${JSON.stringify(spec[field])} in the relief schema but ${JSON.stringify(flat[field])} in Subdivision's.`
          )
        );
    });
}

// Leva clamps an out-of-range preset silently.
function checkPresets({ PRESETS: presets }) {
  const scene = new Set(SCENE_KEYS);
  Object.entries(presets).forEach(([name, preset]) => {
    Object.entries(preset).forEach(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      check(scene.has(key), `preset "${name}" sets "${key}", not a scene key.`);
      if (spec?.type === 'number') {
        check(
          value >= spec.min && value <= spec.max,
          `preset "${name}" sets ${key} = ${value}, outside [${spec.min}, ${spec.max}].`
        );
      }
      if (spec?.type === 'enum') {
        check(
          spec.choices.includes(value),
          `preset "${name}" sets ${key} = "${value}", not one of its choices.`
        );
      }
    });
  });
}

// Every roll is a config the scene accepts; a held facet does not move.
function checkRolls({ look, relief }) {
  const paletteNames = look.PALETTE_NAMES;
  for (let i = 0; i < 30; i += 1) {
    const config = relief.rollReliefConfig(`check-${i}`, { paletteNames });
    check(
      Object.keys(config).every((key) => SCENE_KEYS.includes(key)),
      `roll check-${i} carries keys outside the scene schema.`
    );
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    check(
      ['depthWeight', 'fieldWeight', 'lumaWeight'].some(
        (key) => config[key] >= 0.2
      ),
      `roll check-${i} leaves the relief flat.`
    );
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }
  const source = relief.rollReliefConfig('b', { paletteNames });
  relief.facets().forEach((facet) => {
    const held = relief.rollReliefConfig('a', {
      base: source,
      keep: [facet],
      paletteNames,
    });
    relief
      .keysInFacet(facet)
      .filter((key) => SCENE_KEYS.includes(key))
      .forEach((key) =>
        check(
          held[key] === source[key],
          `holding ${facet} still re-rolled "${key}".`
        )
      );
  });
}

function pieceFor({ look, relief }, extra = {}) {
  const config = { ...relief.sceneDefaults(), seed: 'check', ...extra };
  const stops = look.getPaletteStops(config.palette);
  return {
    config,
    piece: relief.buildReliefPiece(config, { canvas: CANVAS, stops }),
  };
}

function checkLayout(kernel) {
  const { relief } = kernel;
  ['quad', 'tri', 'rect'].forEach((lattice) => {
    const { config, piece } = pieceFor(kernel, { lattice });
    const heights = relief.computeHeights(piece, config);
    const top = config.baseHeight + config.reliefHeight;
    check(
      heights.every((h) => h >= config.baseHeight - 1e-6 && h <= top + 1e-6),
      `${lattice}: a height falls outside [base, base + relief].`
    );
    const world = relief.toWorld(piece.canvas);
    const placed = piece.nodes.filter((node) =>
      relief.placement(node, piece.canvas, world)
    );
    check(placed.length > 0, `${lattice}: no cell is placed on the canvas.`);
    const { max, min } = relief.boundsOf(piece, config);
    check(
      [0, 1, 2].every(
        (a) => Number.isFinite(min[a] + max[a]) && max[a] > min[a]
      ),
      `${lattice}: the bounds are empty or not finite.`
    );
  });
  const config = {
    ...relief.sceneDefaults(),
    collapseSeconds: 1,
    growSeconds: 2,
    holdSeconds: 1,
  };
  check(
    relief.growAt(0, config, 5) === 0 &&
      relief.growAt(2, config, 5) === 5 &&
      relief.growAt(2.5, config, 5) === 5 &&
      relief.growAt(4, config, 5) === 0 &&
      relief.cycleSeconds(config) === 4,
    'the grow clock does not split, hold and recombine.'
  );
}

async function checkHeadlessCalls(kernel) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [
        ...source.matchAll(
          /\b(?:kernel\.)?(lights|look|relief|subdivision)\.(\w+)/gu
        ),
      ].forEach(([, barrel, name]) =>
        check(
          name in kernel[barrel],
          `${file} calls ${barrel}.${name}, which its barrel does not export.`
        )
      );
    })
  );
}

// The rig compiles to valid WGSL and draws more than the backdrop on every
// lattice and grow style, mid-growth and fully split.
async function checkRender(kernel) {
  const { THREE, lights, look, relief } = kernel;
  const size = 160;
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      // eslint-disable-next-line no-param-reassign
      renderer.shadowMap.enabled = true;
    },
    height: size,
    width: size,
  });
  const { renderer } = headless;
  const { device } = renderer.backend;
  const scene = new THREE.Scene();
  // The target is read back linear, so the dark plate reads near black; a
  // white backdrop keeps "something drawn" unambiguous.
  scene.background = new THREE.Color('#ffffff');
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const rig = look.createReliefRig();
  scene.add(
    rig.group,
    lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: {},
        lighting: look.SUBDIVISION_RELIEF_LIGHTING,
      }),
      { shadows: true }
    )
  );
  const cases = [
    { lattice: 'quad' },
    { lattice: 'tri' },
    { growStyle: 'slide', lattice: 'rect' },
    { holeChance: 0.2, lattice: 'quad' },
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const extra of cases) {
    const { config, piece } = pieceFor(kernel, extra);
    const view = relief.frameView({
      config,
      options: {
        fov: 30,
        height: size,
        margin: 0.05,
        projection: 'perspective',
        width: size,
      },
      piece,
      view: 'hero',
    });
    camera.near = view.near;
    camera.far = view.far;
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    rig.apply(config);
    rig.setPiece(piece);
    rig.setMotion(relief.motionAt(config, 1));
    // eslint-disable-next-line no-restricted-syntax
    for (const grow of [1.5, piece.maxDepth + 1]) {
      rig.setGrow(grow);
      device.pushErrorScope('validation');
      // eslint-disable-next-line no-await-in-loop
      const frame = await headless.readFrame(() =>
        renderer.render(scene, camera)
      );
      // eslint-disable-next-line no-await-in-loop
      const error = await device.popErrorScope();
      const label = `${JSON.stringify(extra)} at grow ${grow}`;
      check(!error, `the rig fails validation (${label}): ${error?.message}`);
      let marked = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] < 735) {
          marked += 1;
        }
      }
      check(
        marked > size * size * 0.1,
        `the piece draws almost nothing (${label}).`
      );
    }
  }
  rig.dispose();
  headless.dispose();
}

async function main() {
  await checkWorkbenchPage(PAGE, RENDER_OPTIONS, check);
  await checkThreeFree();
  checkSharedSpecs();

  const kernel = await loadKernel();
  const loaded = await loadModules([PRESETS]);
  checkPresets(loaded[PRESETS]);
  checkRolls(kernel);
  checkLayout(kernel);
  await checkHeadlessCalls(kernel);
  await checkRender(kernel);

  if (failures.length > 0) {
    console.error(`subdivision-relief:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'subdivision-relief:check — schema, kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
