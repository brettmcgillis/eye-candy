#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Imperfection pipeline: the scene, the CLIs and the
// workbench must agree with the kernel, the reference composition must stay
// verbatim, and both versions must compile and draw. See
// docs/imperfection-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  VARIANTS,
  normalizeOptions,
} from '../src/modules/imperfection/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'imperfection');
const PRESETS = '/src/components/scenes/WebGPU/Imperfection/presets/presets.js';
const HEADLESS = [
  'lib/imperfectionRender.mjs',
  'imperfection-generate.mjs',
  'imperfection-video.mjs',
];
const BARRELS = {
  imperfection: '/src/modules/imperfection/index.js',
  look: '/src/modules/imperfectionRender/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/imperfection/ImperfectionWorkbenchPage.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set(['@modules/flora']);
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;

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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/imperfectionRender.`
          )
        );
    })
  );
}

// The reference painting is data the shader reads verbatim: counts, the
// rectangles the background never sees, the bundles' constants.
function checkComposition({ imperfection: k }) {
  check(k.WARM_ANCHORS.length === 36, 'the warm family must hold 36 anchors.');
  check(k.COOL_ANCHORS.length === 47, 'the cool family must hold 47 anchors.');
  check(k.RECTS.length === 11, 'the reference has 11 rectangles.');
  check(
    k.FIELD_RECTS === 9,
    'the first 9 rectangles are painted into the field.'
  );
  check(
    k.BG_SKIP.join() === '0,5,6',
    'BG_SKIP is the coral block and the two slate blocks.'
  );
  [k.LITE, k.WILD].forEach((variant, i) =>
    Object.keys(variant).forEach((key) =>
      check(
        key in RENDER_OPTIONS,
        `${i ? 'WILD' : 'LITE'} sets "${key}", which renderOptions.mjs does not declare.`
      )
    )
  );
  check(
    VARIANTS.includes(k.LITE.variant),
    'LITE must pick a version the schema knows.'
  );
}

// A default config is the reference: no warp, colours untouched; and a warp
// must invert, or the zones would drift off the paint they describe.
function checkLayoutAndPalette({ imperfection: k }) {
  const defaults = k.sceneDefaults();
  const data = k.paintingData(defaults);
  check(data.canonical, 'the default layout is not the reference layout.');
  const [u0, v0, reach, hex] = k.WARM_ANCHORS[0];
  const first = data.warm[0];
  check(
    first.position.join() === [u0, v0, reach].join() &&
      first.color.join() === k.hexToRgb(hex).join(),
    'the default palette or layout moved the first anchor.'
  );
  const knots = k.layoutKnots({
    ...defaults,
    columnLeft: 0.27,
    columnRight: 0.55,
    seamRight: 0.8,
  });
  [0, 0.1, 0.2, 0.35, 0.49, 0.6, 0.72, 0.9, 1].forEach((x) => {
    const there = k.mapAxis(x, k.CANONICAL_U, knots.u);
    const back = k.mapAxis(there, knots.u, k.CANONICAL_U);
    check(
      Math.abs(back - x) < 1e-9,
      `the layout warp does not invert at u = ${x}.`
    );
  });
}

// Every archetype, at many seeds, must fill the shader's fixed arrays with
// finite numbers on (or just beyond) the canvas.
function checkCompositions({ imperfection: k }) {
  ['cross', 'horizon', 'portal', 'burst', 'columns'].forEach((composition) => {
    for (let seed = 0; seed < 25; seed += 1) {
      const config = k.rollImperfectionConfig(`comp-${seed}`, {
        pinned: { composition },
      });
      const data = k.paintingData(config);
      const tag = `${composition} seed comp-${seed}`;
      check(
        data.warm.length === 36,
        `${tag}: ${data.warm.length} warm anchors.`
      );
      check(
        data.cool.length === 47,
        `${tag}: ${data.cool.length} cool anchors.`
      );
      check(
        data.rects.length === 11,
        `${tag}: ${data.rects.length} rectangles.`
      );
      const numbers = [
        ...data.warm.flatMap((a) => [...a.position, ...a.color]),
        ...data.cool.flatMap((a) => [...a.position, ...a.color]),
        ...data.rects.flatMap((r) => [...r.box, ...r.color]),
        ...Object.values(data.zones).flatMap((arr) => [...arr]),
      ];
      check(numbers.every(Number.isFinite), `${tag}: a non-finite number.`);
      check(
        data.rects.every((r) => r.box[2] > r.box[0] && r.box[3] > r.box[1]),
        `${tag}: an empty rectangle.`
      );
    }
  });
}

function checkPresets({ PRESETS: presets }) {
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
    Object.entries(preset)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `preset "${name}" sets ${key} = ${value}, outside [${min}, ${max}] — Leva would clamp it.`
        );
      });
    Object.entries(preset)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'enum')
      .forEach(([key, value]) =>
        check(
          RENDER_OPTIONS[key].choices.includes(value),
          `preset "${name}" sets ${key} = "${value}", not one of its choices.`
        )
      );
  });
}

function checkRolls({ imperfection: k }) {
  for (let i = 0; i < 60; i += 1) {
    const config = k.rollImperfectionConfig(`check-${i}`);
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    const { knots } = k.paintingData(config);
    [knots.u, knots.v].forEach((axis) =>
      check(
        axis.every((v, j) => v > (j ? axis[j - 1] : 0) && v < 1),
        `roll check-${i} builds a layout that folds over itself.`
      )
    );
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }
  const source = k.rollImperfectionConfig('b');
  const held = k.rollImperfectionConfig('a', {
    base: source,
    keep: ['layout'],
  });
  k.keysInFacet('layout').forEach((key) =>
    check(held[key] === source[key], `holding layout still re-rolled "${key}".`)
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(imperfection|look)\.(\w+)/gu)]
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

// Both versions and every view must compile to valid WGSL and paint the
// square; the reference is never black and never one flat colour.
async function checkRender({ imperfection: k, look }, THREE, TSL) {
  const size = 128;
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      // eslint-disable-next-line no-param-reassign
      renderer.toneMapping = THREE.NoToneMapping;
    },
    height: size,
    width: size,
  });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;
  const rig = look.createPaintRig();
  scene.add(rig.mesh);
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = TSL.pass(scene, camera);
  const { device } = renderer.backend;
  const cases = [
    ['full', 'painting'],
    ['full', 'field'],
    ['full', 'wetness'],
    ['full', 'blocks'],
    ['full', 'painting', { wetLic: true }],
    ['full', 'blocks', { blockEngine: 'quadtree' }],
    ['full', 'blocks', { blockEngine: 'rect' }],
    ['lite', 'painting', { blockEngine: 'rect' }],
    ...['cross', 'horizon', 'portal', 'burst', 'columns'].map((composition) => [
      'full',
      'painting',
      { composition },
    ]),
    ['lite', 'painting', { composition: 'horizon' }],
    ['full', 'painting', { impasto: 0.8 }],
    ['lite', 'painting', { impasto: 0.8 }],
    ['full', 'blocks', { composition: 'portal', blockEngine: 'rect' }],
    ['full', 'painting', { motif: 'logo' }],
    ['full', 'painting', { motif: 'tiled', motifStyle: 'outline' }],
    ['lite', 'painting', { motif: 'tiled' }],
    ['lite', 'painting'],
    ['lite', 'field'],
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const [variant, view, extra = {}] of cases) {
    device.pushErrorScope('validation');
    const built = rig.apply(
      { ...k.sceneDefaults(), ...extra, variant },
      { time: 3, view }
    );
    check(
      built.variant === variant &&
        built.engine === (extra.blockEngine ?? 'grid') &&
        built.lic === (variant === 'full' && Boolean(extra.wetLic)),
      `${variant}/${view} ${JSON.stringify(extra)} built ${JSON.stringify(built)}.`
    );
    // eslint-disable-next-line no-await-in-loop
    const frame = await headless.readFrame(() => pipeline.render());
    // eslint-disable-next-line no-await-in-loop
    const error = await device.popErrorScope();
    check(
      !error,
      `${variant}/${view} ${JSON.stringify(extra)} fails validation: ${error?.message}`
    );
    const lums = [];
    for (let i = 0; i < frame.data.length; i += 4) {
      lums.push(frame.data[i] + frame.data[i + 1] + frame.data[i + 2]);
    }
    const lit = lums.filter((v) => v > 12).length;
    const spread = Math.max(...lums) - Math.min(...lums);
    check(
      lit > size * size * 0.9,
      `${variant}/${view} leaves the square dark.`
    );
    check(spread > 150, `${variant}/${view} paints one flat colour.`);
  }
  // An image source: blue on top, red below (the reverse of the reference's
  // own left edge), must land the right way up.
  const frame = { data: new Uint8Array(16 * 16 * 4), height: 16, width: 16 };
  for (let i = 0; i < 16 * 16; i += 1) {
    frame.data.set(i < 128 ? [30, 60, 200, 255] : [220, 40, 30, 255], i * 4);
  }
  rig.setSource(frame);
  const sourced = await headless.readFrame(() => {
    rig.apply(
      { ...k.sceneDefaults(), fieldSource: 'image' },
      { view: 'field' }
    );
    pipeline.render();
  });
  const at = (x, y) => {
    const i = (Math.floor(y * size) * size + Math.floor(x * size)) * 4;
    return sourced.data.subarray(i, i + 3);
  };
  const [tr, , tb] = at(0.25, 0.04);
  const [br, , bb] = at(0.25, 0.96);
  check(
    tb > tr && br > bb,
    `an image source lands upside down (top ${tr}/${tb}, bottom ${br}/${bb}).`
  );
  rig.setSource(null);
  rig.dispose();
  headless.dispose();
}

async function main() {
  await checkKernelPurity();
  await checkWorkbenchPage(PAGE_FIELDS, RENDER_OPTIONS, check);

  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkComposition(barrels);
  checkLayoutAndPalette(barrels);
  checkCompositions(barrels);
  checkPresets(loaded[PRESETS]);
  checkRolls(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE, TSL);

  if (failures.length > 0) {
    console.error(`imperfection:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'imperfection:check — kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
