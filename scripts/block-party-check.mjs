#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Block Party pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share. See
// docs/block-party-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
} from '../src/modules/blockParty/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'blockParty');
const PRESETS = '/src/components/scenes/WebGPU/BlockParty/presets/presets.js';
const HEADLESS = [
  'lib/blockPartyRender.mjs',
  'block-party-generate.mjs',
  'block-party-video.mjs',
];
const BARRELS = {
  city: '/src/modules/blockParty/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/blockPartyRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/blockParty/components/OptionSections.jsx'
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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/blockPartyRender.`
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
    lighting: look.BLOCK_PARTY_LIGHTING,
  });
  const slot = (id) => lighting.slots.find((entry) => entry.id === id);
  const postSlots = post.buildScenePostRuntimeConfig(
    look.BLOCK_PARTY_POST
  ).slots;
  const postSlot = (type) => postSlots.find((entry) => entry.type === type);
  const expected = {
    lightAmbientIntensity: slot('ambient')?.intensity,
    lightSunIntensity: slot('sun')?.intensity,
    postBloomStrength: postSlot('bloom')?.strength,
    postBloomThreshold: postSlot('bloom')?.threshold,
    postGrainAmount: postSlot('grain')?.amount,
    postInkColor: postSlot('ink')?.color,
    postInkStrength: postSlot('ink')?.strength,
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

function checkUniforms({ look }) {
  look.SCALAR_KEYS.forEach((key) =>
    check(
      RENDER_OPTIONS[key]?.type === 'number',
      `uniform "${key}" has no number option in renderOptions.mjs.`
    )
  );
  Object.entries(look.ENUMS).forEach(([key, values]) => {
    const choices = RENDER_OPTIONS[key]?.choices ?? [];
    check(
      choices.length === values.length &&
        choices.every((choice) => values.includes(choice)),
      `the shader's "${key}" values (${values}) differ from the option's choices (${choices}).`
    );
  });
}

// A rolling rebuild must land every district back at ground level and then
// re-emerge, and the SVG must draw something for a settled city.
function checkKernelBehaviour({ city }) {
  const config = city.sceneDefaults();
  const model = city.buildCityModel({
    composition: city.compositionOf(config),
    referenceHeight: config.referenceHeight,
    seed: config.seed,
  });
  const state = city.createRebuildState(model, { order: 'spiral', seed: 2 });
  const dt = 1 / 30;
  let clock = city.SETTLED;
  let changes = 0;
  for (let frame = 0; frame < 30 * 40; frame += 1) {
    clock += dt / config.buildSeconds;
    if (
      city.stepRebuild(state, {
        clock,
        composition: city.compositionOf(config),
        enabled: true,
        every: 2,
        referenceHeight: config.referenceHeight,
        revealBand: config.revealBand,
        seconds: dt,
      })
    ) {
      changes += 1;
    }
  }
  check(
    changes >= 4,
    `a 40s rolling rebuild changed the cells only ${changes} times.`
  );
  check(
    state.generations.some((generation) => generation > 0),
    'a 40s rolling rebuild never replaced a district.'
  );

  const { layers } = city.layCity({
    cells: model.cells,
    colorBy: 'district',
    metrics: city.metricsOf(config),
    model,
  });
  const svg = city.renderBlockPartySvg({
    camera: {
      eye: [30, 20, 30],
      halfHeight: 8,
      halfWidth: 8,
      target: [0, 0, 0],
      up: [0, 1, 0],
    },
    colors: city.resolveSurfaceColors(config, null),
    config,
    height: 400,
    layers,
    pedestal: { depth: 160, radius: model.radius, shape: 'square' },
    scale: city.cityScale(config, model),
    stops: null,
    width: 400,
  });
  check(
    (svg.match(/<path /gu) ?? []).length > 0,
    'the plot SVG of a settled default city has no paths.'
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(city|look|lights|post)\.(\w+)/gu)]
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

  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkUniforms(barrels);
  checkKernelBehaviour(barrels);
  await checkHeadlessCalls(barrels);

  if (failures.length > 0) {
    console.error(`block-party:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log('block-party:check — kernel, scene, CLIs and workbench agree.');
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
