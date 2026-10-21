#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the BirdsArentReal pipeline: the FakeBird species, the
// kernel, the CLIs and the workbench must agree, the plot must draw and hide
// what it should, and the real stage must mount and draw headlessly — the
// last is what breaks if R3F loads as Node's CommonJS copy, the GLTF shim
// stops decoding Draco/WebP or the bird outgrows the box the framing fits.
// See docs/birds-arent-real-pipeline.md.
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  ARRANGEMENTS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/birdsArentReal/renderOptions.mjs';
import {
  createFlockCapturer,
  flockAt,
  loadKernel,
  rollArgs,
} from './lib/birdsArentRealRender.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'birdsArentReal');
const TOOL_DIR = path.join(REPO_ROOT, 'src/dev/tools/birdsArentReal');
const SCENE = path.join(
  REPO_ROOT,
  'src/components/scenes/WebGPU/BirdsArentReal/BirdsArentReal.jsx'
);
const SPECIES = '/src/components/elements/FakeBird/birds.js';
const PLOT_KIT = '/src/modules/plotKit/index.js';
const ALLOWED_KERNEL_IMPORTS = new Set(['@modules/flora', '@modules/plotKit']);

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
            `kernel purity: ${name} imports "${specifier}" — stage code belongs in @modules/birdsArentRealRender.`
          )
        );
    })
  );
}

// The scene and the workbench draw the same FakeBird.
async function checkScene() {
  const source = await readFile(SCENE, 'utf8');
  check(
    source.includes("from '@elements/FakeBird/FakeBird'"),
    'BirdsArentReal no longer draws @elements/FakeBird — the workbench would render a different bird.'
  );
}

async function checkSpecies({ look }) {
  const { BIRDS } = (await loadModules([SPECIES]))[SPECIES];
  check(look.SPECIES_NAMES.includes('pigeon'), 'the pigeon species is gone.');
  await Promise.all(
    Object.entries(BIRDS).map(async ([name, bird]) => {
      ['file', 'headBone', 'clips', 'cam'].forEach((key) =>
        check(bird[key] !== undefined, `species "${name}" has no "${key}".`)
      );
      ['scale', 'offset', 'rot', 'ledOffset'].forEach((key) =>
        check(
          bird.cam?.[key] !== undefined,
          `species "${name}" has no cam.${key}.`
        )
      );
      await access(path.join(REPO_ROOT, 'public/models', bird.file)).catch(() =>
        failures.push(`species "${name}" names a missing ${bird.file}.`)
      );
    })
  );
}

function checkRolls(kernel) {
  const { birds } = kernel;
  const roll = rollArgs(kernel, { options: { keep: '' }, typed: new Set() });
  const arrangements = new Set();
  for (let i = 0; i < 36; i += 1) {
    const { config } = flockAt(kernel, { batch: 'check', index: i, roll });
    arrangements.add(config.arrangement);
    SCENE_KEYS.forEach((key) =>
      check(config[key] !== undefined, `roll check-${i} leaves out "${key}".`)
    );
    try {
      normalizeOptions('still', { ...config, png: true });
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
    const flock = birds.layoutFlock(config);
    check(
      flock.length === config.birdCount,
      `roll check-${i} lays out ${flock.length} birds, not ${config.birdCount}.`
    );
    if (config.arrangement === 'cluster') {
      let closest = Infinity;
      flock.forEach((a, m) =>
        flock.slice(m + 1).forEach((b) => {
          closest = Math.min(
            closest,
            Math.hypot(
              a.position[0] - b.position[0],
              a.position[2] - b.position[2]
            )
          );
        })
      );
      check(
        closest >= config.spacing * 0.6,
        `roll check-${i}: two clustered birds stand ${closest.toFixed(2)} m apart.`
      );
    }
  }
  check(
    ARRANGEMENTS.every((name) => arrangements.has(name)),
    'the flock roll never lands on some arrangements.'
  );
  check(
    JSON.stringify(birds.rollFlockConfig('check', roll)) ===
      JSON.stringify(
        flockAt(kernel, { batch: 'check', index: 0, roll }).config
      ),
    'a batch seed must roll the same generation every time.'
  );
  const { config } = flockAt(kernel, { batch: 'check', index: 3, roll });
  check(
    JSON.stringify(birds.layoutFlock(config)) ===
      JSON.stringify(birds.layoutFlock({ ...config })),
    'a config must lay out the same flock every time.'
  );
}

// A unit cube seen from a corner: its silhouette edges are contours, the
// edges between its three visible faces creases, and slices cross it.
async function checkPlot({ birds }) {
  const P = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];
  const F = [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
    [0, 1, 5],
    [0, 5, 4],
    [3, 7, 6],
    [3, 6, 2],
    [0, 4, 7],
    [0, 7, 3],
    [1, 2, 6],
    [1, 6, 5],
  ];
  const position = new Float32Array(P.flat().map((v) => v * 0.3));
  const flock = {
    birds: [{ inverse: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }],
    meshes: [
      { bird: 0, index: Uint32Array.from(F.flat()), position, rest: position },
    ],
  };
  const options = { fov: 30, height: 400, margin: 0.08, width: 400 };
  const config = { cameraAzimuth: 35, cameraElevation: 25, cameraZoom: 1 };
  const camera = birds.frameFlock({
    bounds: { points: P.map((p) => p.map((v) => v * 0.3)) },
    config,
    options,
  });
  const plot = (extra) =>
    birds.renderFlockSvg({
      camera,
      flock,
      height: 400,
      lines: 6,
      width: 400,
      ...extra,
    });
  const drawn = plot({});
  check(/id="pen-0"/u.test(drawn), 'the slice layer draws nothing.');
  check(/id="pen-3"/u.test(drawn), 'the contour layer draws nothing.');
  check(/id="pen-5"/u.test(drawn), 'the crease layer draws nothing.');
  check(
    /id="pen-0"/u.test(plot({ style: 'sections' })),
    'the section layer draws nothing.'
  );
  check(
    !/id="pen-\d"/u.test(plot({ visible: () => false })),
    'hidden-line removal no longer hides anything.'
  );
  const { weldMesh } = (await loadModules([PLOT_KIT]))[PLOT_KIT];
  const welded = weldMesh({
    index: null,
    position: new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
    ]),
    rest: new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
    ]),
  });
  check(welded.count === 4, 'welding no longer joins split vertices.');
  const covered = new Uint8Array(100 * 100);
  for (let y = 20; y < 80; y += 1) covered.fill(1, y * 100 + 20, y * 100 + 80);
  const gradient = {
    data: new Uint8Array(100 * 100 * 4),
    height: 100,
    width: 100,
  };
  for (let i = 0; i < 100 * 100; i += 1) {
    gradient.data.fill(Math.round(((i % 100) / 100) * 255), i * 4, i * 4 + 3);
  }
  const shaded = plot({
    coverage: { covered, height: 100, width: 100 },
    image: gradient,
    pixelRatio: 0.25,
    shade: { angle: 45, gamma: 1, shading: 'crosshatch', spacing: 6 },
    silhouette: true,
    style: 'none',
  });
  check(/id="pen-1"/u.test(shaded), 'the silhouette layer draws nothing.');
  check(/id="pen-2"/u.test(shaded), 'the shading layer draws nothing.');
}

// The real stage, headless: a flock must load (Draco and WebP through the
// GLTF shim), animate, stay inside the box the framing fits, and draw.
async function checkRender(kernel) {
  const { birds, look } = kernel;
  const options = {
    ...normalizeOptions('still', { png: true }),
    height: 120,
    pixelRatio: 1,
    svgShading: 'none',
    width: 96,
  };
  const capturer = await createFlockCapturer(kernel, {
    height: 120,
    pixelRatio: 1,
    width: 96,
  });
  try {
    const config = {
      ...birds.sceneDefaults(),
      arrangement: 'line',
      backgroundColor: '#000000',
      birdCount: 2,
      headScale: 0.6,
      settle: 0.5,
    };
    const { bounds } = await capturer.load(config, options);
    const mesh = look.readFlockMesh(capturer.flock);
    check(
      mesh.meshes.length === config.birdCount * 3,
      `the flock reads back ${mesh.meshes.length} meshes, not body + camera per bird.`
    );
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    const layout = birds.layoutFlock(config);
    mesh.meshes.forEach(({ bird, position }) => {
      const { inverse } = mesh.birds[bird];
      for (let i = 0; i < position.length; i += 3) {
        const [x, y, z] = [position[i], position[i + 1], position[i + 2]];
        const local = [
          inverse[0] * x + inverse[4] * y + inverse[8] * z + inverse[12],
          inverse[1] * x + inverse[5] * y + inverse[9] * z + inverse[13],
          inverse[2] * x + inverse[6] * y + inverse[10] * z + inverse[14],
        ];
        for (let k = 0; k < 3; k += 1) {
          lo[k] = Math.min(lo[k], local[k]);
          hi[k] = Math.max(hi[k], local[k]);
        }
      }
    });
    const slack = 0.06;
    [0, 1, 2].forEach((k) =>
      check(
        lo[k] >= birds.BIRD_BOX.min[k] - slack &&
          hi[k] <= birds.BIRD_BOX.max[k] + slack,
        `a posed bird spans ${lo[k].toFixed(2)}..${hi[k].toFixed(2)} on axis ${k}, outside BIRD_BOX — remeasure it.`
      )
    );
    check(layout.length === 2, 'the check flock did not lay out two birds.');
    const view = birds.frameFlock({ bounds, config, options, view: 'front' });
    const frame = await capturer.capture(view);
    let lit = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 60) lit += 1;
    }
    check(
      lit > 96 * 120 * 0.03,
      'the headless stage drew no birds (R3F, the GLTF shim or the studio failed).'
    );
    const svg = await capturer.svg(view, { ...options, svg: true });
    check(/id="pen-3"/u.test(svg), 'the flock plot traces no contours.');
    check(/id="pen-1"/u.test(svg), 'the flock plot traces no silhouette.');
    const inked = await capturer.svg(view, {
      ...options,
      svg: true,
      svgColors: 3,
    });
    check(
      (inked.match(/ sections \d #[0-9a-f]{6}/gu) ?? []).length >= 2,
      "svgColors no longer splits the sections into the birds' own inks."
    );
  } finally {
    capturer.dispose();
  }
}

async function main() {
  await checkKernelPurity();
  await checkScene();
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'BirdsArentRealWorkbenchPage.jsx'),
    RENDER_OPTIONS,
    check
  );
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'LiveFlock.jsx'),
    RENDER_OPTIONS,
    check
  );
  const kernel = await loadKernel();
  await checkSpecies(kernel);
  checkRolls(kernel);
  await checkPlot(kernel);
  await checkRender(kernel);

  if (failures.length > 0) {
    console.error(`birds-arent-real:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'birds-arent-real:check — species, kernel, plot, stage and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
