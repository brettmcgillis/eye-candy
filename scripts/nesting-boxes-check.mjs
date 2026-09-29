#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Nesting Boxes pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share, and the kernel's CPU tree
// must agree with the GPU compute the renders draw. See
// docs/nesting-boxes-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  SURFACE_NAMES,
  normalizeOptions,
} from '../src/modules/nestingBoxes/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'nestingBoxes');
const PRESETS = '/src/components/scenes/WebGPU/NestingBoxes/presets/presets.js';
const HEADLESS = [
  'lib/nestingBoxesRender.mjs',
  'nesting-boxes-generate.mjs',
  'nesting-boxes-video.mjs',
];
const BARRELS = {
  boxes: '/src/modules/nestingBoxes/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/nestingBoxesRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const TREE_COMPUTE = '/src/modules/nestingBoxesRender/treeCompute.js';
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/nestingBoxes/components/OptionSections.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@utils/paletteStops',
]);
// Keys the camera rig owns; a preset may carry them but the schema does not.
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

// The kernel runs in plain Node; nothing that needs a renderer, React or
// Node built-ins may reach it.
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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/nestingBoxesRender.`
          )
        );
    })
  );
  const schema = await readFile(
    path.join(KERNEL_DIR, 'renderOptions.mjs'),
    'utf8'
  );
  [...schema.matchAll(/^import .* from '([^']+)';$/gmu)]
    .map(([, specifier]) => specifier)
    .filter((specifier) => specifier !== '../optionSchema/index.mjs')
    .forEach((specifier) =>
      failures.push(
        `renderOptions.mjs imports "${specifier}" — it must stay dependency-free.`
      )
    );
}

// Rig-owned keys are declared in the schema so presets and renders carry
// them; their defaults must be the declarations the rigs build from.
function checkRigDefaults({ lights, look, post }) {
  const lighting = lights.buildSceneLightingRuntimeConfig({
    lighting: look.NESTING_BOXES_LIGHTING,
  });
  const slot = (id) => lighting.slots.find((entry) => entry.id === id);
  const bloom = post
    .buildScenePostRuntimeConfig(look.NESTING_BOXES_POST)
    .slots.find((entry) => entry.type === 'bloom');
  const expected = {
    lightKeyColor: slot('key')?.color,
    lightKeyIntensity: slot('key')?.intensity,
    lightSkyGroundColor: slot('sky')?.groundColor,
    lightSkyIntensity: slot('sky')?.intensity,
    lightSkySkyColor: slot('sky')?.skyColor,
    postBloomEnabled: bloom?.enabled,
    postBloomRadius: bloom?.radius,
    postBloomStrength: bloom?.strength,
    postBloomThreshold: bloom?.threshold,
  };
  Object.entries(RENDER_OPTIONS)
    .filter(([, spec]) => spec.rig)
    .forEach(([key, spec]) => {
      check(
        key in expected,
        `"${key}" is a rig key the check does not know how to verify.`
      );
      check(
        spec.default === expected[key],
        `"${key}" defaults to ${spec.default} in renderOptions.mjs but the rig declares ${expected[key]}.`
      );
    });
}

// Leva keeps a value a preset leaves out, so a hand-written preset that
// skips a control inherits it from whichever preset was showing before.
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

function checkLook({ look }) {
  check(
    SURFACE_NAMES.length === look.SURFACE_NAMES.length &&
      SURFACE_NAMES.every((name) => look.SURFACE_NAMES.includes(name)),
    `renderOptions' surfaces (${SURFACE_NAMES}) differ from the render module's (${look.SURFACE_NAMES}).`
  );
}

// Every roll must be a config the scene accepts, and none may turn on the
// unfinished windows.
function checkRolls({ boxes, look }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
  );
  for (let i = 0; i < 40; i += 1) {
    const config = boxes.rollNestingBoxesConfig(`check-${i}`, { palettes });
    check(!config.windowsEnabled, `roll check-${i} turned windows on.`);
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
  }
  const held = boxes.rollNestingBoxesConfig('a', {
    base: boxes.rollNestingBoxesConfig('b', { palettes }),
    keep: ['structure'],
    palettes,
  });
  const source = boxes.rollNestingBoxesConfig('b', { palettes });
  boxes
    .keysInFacet('structure')
    .forEach((key) =>
      check(
        held[key] === source[key],
        `holding structure still re-rolled "${key}".`
      )
    );

  const svg = boxes.renderNestingBoxesSvg({
    camera: {
      eye: [9, 6, 11],
      fov: 40,
      target: [0, 0, 0],
      up: [0, 1, 0],
    },
    config: { ...boxes.sceneDefaults(), levels: 8 },
    height: 400,
    stops: null,
    width: 400,
  });
  check(
    (svg.match(/<path /gu) ?? []).length > 0,
    'the plot SVG of a default tree has no paths.'
  );
}

// The SVG, the framing and the pens all read the CPU tree, so it must land
// every node where the compute kernel does.
async function checkTreeMirror({ boxes }, { applyTreeConfig, compute }) {
  const headless = await createHeadlessRenderer({ height: 4, width: 4 });
  const tree = compute();
  const level = 12;
  const config = {
    ...boxes.sceneDefaults(),
    driftBias: 1.5,
    levels: level,
    seed: 4321,
  };
  const drift = {
    placement: [0.7, -0.4, 1.3],
    shrink: 0.02,
    size: [-0.5, 0.9, 0.2],
    tint: 0,
  };
  applyTreeConfig(tree.uniforms, config, drift);
  tree.run(headless.renderer, level);
  const read = async (node) =>
    new Float32Array(await headless.renderer.getArrayBufferAsync(node.value));
  const [centers, radii] = await Promise.all([
    read(tree.centers),
    read(tree.radii),
  ]);
  const cpu = boxes.treeLevel(config, { drift, level });
  let worst = 0;
  for (let i = 0; i < cpu.count; i += 1) {
    const id = cpu.first + i;
    for (let a = 0; a < 3; a += 1) {
      const scale = Math.abs(
        config[['rootRadiusX', 'rootRadiusY', 'rootRadiusZ'][a]]
      );
      worst = Math.max(
        worst,
        Math.abs(centers[id * 4 + a] - cpu.centers[i * 3 + a]) / scale,
        Math.abs(radii[id * 4 + a] - cpu.radii[i * 3 + a]) / scale
      );
    }
  }
  check(
    worst < 1e-4,
    `the CPU tree drifts from the GPU kernel by ${worst.toExponential(2)} of the root size at level ${level}.`
  );
  tree.kernel.dispose();
  headless.dispose();
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(boxes|look|lights|post)\.(\w+)/gu)]
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

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  // The renderer bootstrap stubs the globals three needs before any module
  // that imports it is evaluated.
  await loadThree();
  const loaded = await loadModules([
    PRESETS,
    TREE_COMPUTE,
    '/src/modules/nestingBoxesRender/applyConfig.js',
    ...Object.values(BARRELS),
  ]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkLook(barrels);
  checkRolls(barrels);
  await checkHeadlessCalls(barrels);
  await checkTreeMirror(barrels, {
    applyTreeConfig:
      loaded['/src/modules/nestingBoxesRender/applyConfig.js'].applyTreeConfig,
    compute: loaded[TREE_COMPUTE].default,
  });

  if (failures.length > 0) {
    console.error(`nesting-boxes:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'nesting-boxes:check — kernel, GPU tree, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
