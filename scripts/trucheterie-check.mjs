#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Trucheterie blob-field pipeline: the scene, the CLI
// and the workbench must agree with the kernel they share. See
// docs/flora-pipeline.md for the arrangement this mirrors. Scoped to the
// Blob Field folder and the Colors folder only — Composition, Grid, Motif,
// Multiscale, Stroke and Retile belong to the square/triangular grid modes,
// which this pipeline does not cover yet.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  PALETTE_NONE,
  RENDER_OPTIONS,
  SCENE_KEYS,
} from '../src/modules/trucheterieBlob/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'trucheterieBlob');
const SCENE = '/src/components/scenes/WebGPU/Trucheterie/components';
const CONTROL_BUILDERS = [
  `${SCENE}/getBlobFieldControls.js`,
  `${SCENE}/getColorControls.js`,
];
const HEADLESS = [
  'lib/trucheterieBlobRender.mjs',
  'trucheterie-generate.mjs',
  'trucheterie-video.mjs',
];
const BARRELS = {
  blob: '/src/modules/trucheterieBlob/index.js',
  look: '/src/modules/trucheterieBlobRender/index.js',
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

// The generator has no renderer, no React and no Leva reachable from it.
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
          `kernel purity: ${name} imports "${offender}" — rendering code belongs in @modules/trucheterieBlobRender.`
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
    collectControls(builder.default({}, {}), controls);
  });
  const sceneNames = new Map(
    SCENE_KEYS.map((key) => [RENDER_OPTIONS[key].sceneKey ?? key, key])
  );

  Object.entries(controls).forEach(([key, control]) => {
    const spec = RENDER_OPTIONS[sceneNames.get(key)];
    if (!spec) return;
    if (control.min === undefined) return;
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
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\bkernel\.(blob|look)\.(\w+)/gu)].forEach(
        ([, barrel, name]) =>
          check(
            name in barrels[barrel],
            `${file} calls kernel.${barrel}.${name}, which ${BARRELS[barrel]} does not export.`
          )
      );
    })
  );
}

async function main() {
  await checkKernelPurity();

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
    console.error(`trucheterie:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'trucheterie:check — blob-field kernel, scene, CLI and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
