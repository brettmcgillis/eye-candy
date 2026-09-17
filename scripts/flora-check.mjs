#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Flora pipeline: the scene, the CLIs and the workbench
// must agree with the kernel they share. See docs/flora-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  PALETTE_NONE,
  RENDER_OPTIONS,
  SCENE_KEYS,
} from '../src/modules/flora/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'flora');
const SCENE = '/src/components/scenes/WebGPU/Flora/components';
const CONTROL_BUILDERS = [
  `${SCENE}/getFormControls.js`,
  `${SCENE}/getLookControls.js`,
  `${SCENE}/getMotionControls.js`,
];
const HEADLESS = [
  'lib/floraRender.mjs',
  'flora-generate.mjs',
  'flora-video.mjs',
];
const BARRELS = {
  flora: '/src/modules/flora/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/floraRender/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/flora/components/OptionSections.jsx'
);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

// The generator runs in a Web Worker and in plain Node; nothing that needs a
// renderer, React or Node built-ins may reach it.
async function checkKernelPurity() {
  const files = (await readdir(KERNEL_DIR)).filter((name) =>
    /\.(js|mjs)$/u.test(name)
  );
  const forbidden =
    /from '(three[^']*|react[^']*|leva|@react-three\/[^']+|node:[^']+|@utils\/[^']+)'/gu;
  await Promise.all(
    files.map(async (name) => {
      const source = await readFile(path.join(KERNEL_DIR, name), 'utf8');
      [...source.matchAll(forbidden)].forEach(([, offender]) =>
        failures.push(
          `kernel purity: ${name} imports "${offender}" — rendering code belongs in @modules/floraRender.`
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

function collectControls(schema, out = {}) {
  Object.entries(schema ?? {}).forEach(([key, value]) => {
    if (value?.schema) collectControls(value.schema, out);
    else if (value && typeof value === 'object' && 'value' in value) {
      // eslint-disable-next-line no-param-reassign
      out[key] = value;
    }
  });
  return out;
}

// The scene's Leva schema is hand-written; this holds its keys and ranges to
// the declaration a preset is written against.
function checkSceneControls(builders) {
  const controls = {};
  builders.forEach((builder) => {
    collectControls(builder.default({}, {}).schema, controls);
  });
  const sceneKeys = new Set(SCENE_KEYS);

  Object.entries(controls).forEach(([key, control]) => {
    const spec = RENDER_OPTIONS[key];
    check(
      sceneKeys.has(key),
      `the scene declares "${key}", which renderOptions.mjs does not mark as a scene control — a generation saved as a preset would never set it.`
    );
    if (!spec || control.min === undefined) return;
    ['min', 'max', 'step'].forEach((bound) =>
      check(
        control[bound] === spec[bound],
        `"${key}" ${bound} is ${control[bound]} in the scene but ${spec[bound]} in renderOptions.mjs.`
      )
    );
    check(
      control.value === spec.default,
      `"${key}" defaults to ${control.value} in the scene but ${spec.default} in renderOptions.mjs.`
    );
  });
  sceneKeys.forEach((key) =>
    check(
      key in controls,
      `renderOptions.mjs marks "${key}" as a scene control, but the scene has no such Leva control.`
    )
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\bkernel\.(flora|look|lights)\.(\w+)/gu)].forEach(
        ([, barrel, name]) =>
          check(
            name in barrels[barrel],
            `${file} calls kernel.${barrel}.${name}, which ${BARRELS[barrel]} does not export.`
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

  const loaded = await loadModules([
    ...CONTROL_BUILDERS,
    ...Object.values(BARRELS),
    '/src/utils/gradientPalette.js',
  ]);
  checkSceneControls(CONTROL_BUILDERS.map((entry) => loaded[entry]));
  await checkHeadlessCalls(
    Object.fromEntries(
      Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
    )
  );
  check(
    loaded['/src/utils/gradientPalette.js'].PALETTE_NONE === PALETTE_NONE,
    'PALETTE_NONE in renderOptions.mjs no longer matches @utils/gradientPalette.'
  );

  if (failures.length > 0) {
    console.error(`flora:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log('flora:check — kernel, scene, CLIs and workbench agree.');
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
