#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the HyperCubes pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share, the kernel's hashes must
// match the references', and the rig must compile and draw. See
// docs/hyper-cubes-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  MAX_CELLS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/hyperCubes/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'hyperCubes');
const PRESETS = '/src/components/scenes/WebGPU/HyperCubes/presets/presets.js';
const HEADLESS = [
  'lib/hyperCubesRender.mjs',
  'hyper-cubes-generate.mjs',
  'hyper-cubes-video.mjs',
];
const BARRELS = {
  cubes: '/src/modules/hyperCubes/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/hyperCubesRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/hyperCubes/components/OptionSections.jsx'
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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/hyperCubesRender.`
          )
        );
    })
  );
}

// The octree's dice are integer pcg3d over float bits; they must stay uint32
// words and land in [0, 1] as the shader's do.
function checkHashes({ cubes }) {
  const word = cubes.pcg3d(0, 0, 0);
  check(
    word.every((v) => Number.isInteger(v) && v >= 0 && v < 2 ** 32),
    'pcg3d must return three uint32 words.'
  );
  const dice = cubes.pcg3df([66.5, 66.5, 66.5]);
  check(
    dice.every((v) => v >= 0 && v <= 1),
    `pcg3df left [0, 1]: ${dice.join(', ')}.`
  );
  check(
    cubes.fs(0) === 0 && cubes.fs(1) > 0 && cubes.fs(1) < 1,
    'fs is not a fract of a sine.'
  );
}

function checkRigDefaults({ lights, look, post }) {
  const lighting = lights.buildSceneLightingRuntimeConfig({
    lighting: look.HYPER_CUBES_LIGHTING,
  });
  const key = lighting.slots.find((entry) => entry.id === 'key');
  const { slots } = post.buildScenePostRuntimeConfig(look.HYPER_CUBES_POST);
  const bloom = slots.find((entry) => entry.id === 'bloom');
  const grade = slots.find((entry) => entry.id === 'grade');
  const expected = {
    lightKeyAzimuth: key?.spherical?.azimuth,
    lightKeyColor: key?.color,
    lightKeyElevation: key?.spherical?.elevation,
    lightKeyIntensity: key?.intensity,
    postBloomEnabled: bloom?.enabled,
    postBloomStrength: bloom?.strength,
    postBloomThreshold: bloom?.threshold,
    postGradeEnabled: grade?.enabled,
    postGradeLetterbox: grade?.letterbox,
    postGradeTint: grade?.tint,
    postGradeVignette: grade?.vignette,
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

// Every roll must be a config the scene accepts, small enough to draw.
function checkRolls({ cubes, look }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
  );
  for (let i = 0; i < 40; i += 1) {
    const config = cubes.rollHyperCubesConfig(`check-${i}`, { palettes });
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    const tree = cubes.buildTree(config);
    check(
      tree.leaves <= MAX_CELLS,
      `roll check-${i} builds ${tree.leaves} cells, over ${MAX_CELLS}.`
    );
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }
  const source = cubes.rollHyperCubesConfig('b', { palettes });
  const held = cubes.rollHyperCubesConfig('a', {
    base: source,
    keep: ['structure'],
    palettes,
  });
  cubes
    .keysInFacet('structure')
    .forEach((key) =>
      check(
        held[key] === source[key],
        `holding structure still re-rolled "${key}".`
      )
    );
}

// A morph must start on its first tree and land on its second, and grow 0
// must be one box: the collapse rule is what makes both seamless.
function checkLayout({ cubes }) {
  const config = cubes.sceneDefaults();
  const a = cubes.buildTree(config);
  const b = cubes.buildTree({ ...config, rectSeed: 0.61 });
  const half = cubes.halfExtents(config);
  const key = (cells) =>
    cells
      .map(({ hi, lo }) => [...lo, ...hi].map((v) => v.toFixed(5)).join(','))
      .sort()
      .join('|');
  const alone = (tree) => key(cubes.layoutCells({ from: tree.root, half }));
  const morph = (t) =>
    key(cubes.layoutCells({ from: a.root, half, t, to: b.root }));
  check(morph(0) === alone(a), 'a morph at t = 0 is not its first tree.');
  check(morph(1) === alone(b), 'a morph at t = 1 is not its second tree.');
  check(
    cubes.layoutCells({ from: a.root, grow: 0, half }).length === 1,
    'grow 0 is not a single box.'
  );

  const instances = cubes.buildInstances({ config, from: a.root });
  const svg = cubes.renderHyperCubesSvg({
    camera: cubes.frameView({
      bounds: cubes.domainBounds(config),
      options: {
        height: 400,
        margin: 0.1,
        projection: 'orthographic',
        width: 400,
      },
      view: 'hero',
    }),
    config,
    height: 400,
    instances,
    width: 400,
  });
  check(
    (svg.match(/<path /gu) ?? []).length > 0,
    'the plot SVG of the default structure has no paths.'
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(cubes|look|lights|post)\.(\w+)/gu)]
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

// The rig and its post chain must compile to valid WGSL and draw something
// other than the backdrop.
async function checkRender({ cubes, look, post }, THREE) {
  const size = 128;
  const headless = await createHeadlessRenderer({ height: size, width: size });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 60);
  camera.position.set(12, 7, 12);
  camera.lookAt(0, 0, 0);
  const rig = look.createCubeRig();
  scene.add(rig.group);
  const config = { ...cubes.sceneDefaults(), floorEnabled: false };
  const tree = cubes.buildTree(config);
  rig.apply(config);
  rig.updateEnvironment(renderer, scene, config);
  rig.setInstances(cubes.buildInstances({ config, from: tree.root }));
  const chain = post.createPostChain({
    camera,
    renderer,
    scene,
    slots: post.buildScenePostRuntimeConfig(look.HYPER_CUBES_POST).slots,
  });
  const { device } = renderer.backend;
  device.pushErrorScope('validation');
  await headless.readFrame(() => chain.pipeline.render());
  const frame = await headless.readFrame(() => chain.pipeline.render());
  const error = await device.popErrorScope();
  check(!error, `the rig fails validation: ${error?.message}`);
  let lit = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 12) lit += 1;
  }
  check(lit > size * size * 0.1, 'the default structure draws almost nothing.');
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
  checkHashes(barrels);
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkRolls(barrels);
  checkLayout(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);

  if (failures.length > 0) {
    console.error(`hyper-cubes:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'hyper-cubes:check — kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
