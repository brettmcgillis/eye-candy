#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Fractal Automata pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share. See
// docs/fractal-automata-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/fractalAutomata/renderOptions.mjs';
import { loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'fractalAutomata');
const PRESETS =
  '/src/components/scenes/WebGPU/FractalAutomata/presets/presets.js';
const HEADLESS = [
  'lib/fractalAutomataRender.mjs',
  'fractal-automata-generate.mjs',
  'fractal-automata-video.mjs',
];
const BARRELS = {
  auto: '/src/modules/fractalAutomata/index.js',
  look: '/src/modules/fractalAutomataRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/fractalAutomata/FractalAutomataWorkbenchPage.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@utils/paletteStops',
]);
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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/fractalAutomataRender.`
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

// A preset that leaves a control out gets its default in the scene, so only
// keys the schema does not know, values outside its range and the Default
// preset drifting from the schema are failures.
function checkPresets({ PRESETS: presets }, { auto }) {
  const scene = new Set(SCENE_KEYS);
  const defaults = auto.sceneDefaults();
  Object.entries(presets).forEach(([name, preset]) => {
    Object.keys(preset)
      .filter((key) => !scene.has(key) && !CAMERA_KEY.test(key))
      .forEach((key) =>
        failures.push(
          `preset "${name}" sets "${key}", which renderOptions.mjs does not declare.`
        )
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
  LEVA_KEYS.forEach((key) =>
    check(
      JSON.stringify(presets.Default[key]) === JSON.stringify(defaults[key]),
      `the Default preset's ${key} differs from the schema default.`
    )
  );
}

function checkRolls({ auto, look }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 3
  );
  for (let i = 0; i < 60; i += 1) {
    const config = auto.rollFractalAutomataConfig(`check-${i}`, { palettes });
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
  const source = auto.rollFractalAutomataConfig('b', { palettes });
  auto.facets().forEach((facet) => {
    const held = auto.rollFractalAutomataConfig('a', {
      base: source,
      keep: [facet],
      palettes,
    });
    auto
      .keysInFacet(facet)
      .forEach((key) =>
        check(
          JSON.stringify(held[key]) === JSON.stringify(source[key]),
          `holding ${facet} still re-rolled "${key}".`
        )
      );
  });
}

// The scene's godrays controls and the postRig slot read the same keys.
function checkGodraysSlot({ auto, look }) {
  const slot = look.godraysSlot(auto.sceneDefaults());
  Object.entries(slot)
    .filter(([key]) => !['id', 'light', 'prefix', 'type'].includes(key))
    .forEach(([key, value]) =>
      check(value !== undefined, `the godrays slot's ${key} is undefined.`)
    );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(auto|look|post)\.(\w+)/gu)]
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

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkPresets(loaded[PRESETS], barrels);
  checkRolls(barrels);
  checkGodraysSlot(barrels);
  await checkHeadlessCalls(barrels);

  if (failures.length > 0) {
    console.error(`fractal-automata:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'fractal-automata:check — kernel, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
