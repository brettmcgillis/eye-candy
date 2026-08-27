#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-console */
// Drift alarm for the Rorschach pipeline, not a test suite: it asserts the
// three surfaces still agree with the kernel they share. Run it after touching
// anything under src/modules/rorschach — a rename that only breaks a
// consumer's runtime path shows up here in a second instead of halfway through
// a video encode. See docs/rorschach-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  RENDER_OPTIONS,
  optionsFor,
} from '../src/modules/rorschach/renderOptions.mjs';
import { REPO_ROOT, loadKernel } from './lib/rorschachRender.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'rorschach');
const WORKBENCH = path.join(
  REPO_ROOT,
  'src/dev/tools/rorschach/RorschachWorkbenchPage.jsx'
);
const SCENE_CONTROLS = path.join(
  REPO_ROOT,
  'src/components/scenes/WebGPU/Rorschach/hooks/useSceneControls.js'
);
const HEADLESS = [
  'lib/rorschachRender.mjs',
  'rorschach-generate.mjs',
  'rorschach-video.mjs',
];

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function checkKernelPurity() {
  const files = (await readdir(KERNEL_DIR)).filter((name) =>
    /\.(js|mjs)$/u.test(name)
  );
  const forbidden =
    /from '(react|react-dom|leva|@react-three\/[^']+|node:[^']+)'/gu;

  await Promise.all(
    files.map(async (name) => {
      const source = await readFile(path.join(KERNEL_DIR, name), 'utf8');
      [...source.matchAll(forbidden)].forEach(([, offender]) => {
        failures.push(
          `kernel purity: ${name} imports "${offender}" — the kernel must run in a browser and in Node alike.`
        );
      });
    })
  );
}

async function checkRenderOptionsIsStandalone() {
  const source = await readFile(
    path.join(KERNEL_DIR, 'renderOptions.mjs'),
    'utf8'
  );
  check(
    !/^import /mu.test(source),
    'renderOptions.mjs has an import — it must stay dependency-free so plain Node can load it without Vite.'
  );
}

// Every `kernel.foo` the headless renderers reach for has to be a real export
// of the barrel. This is the check that earns its keep: that call is a runtime
// property lookup, so nothing else catches a rename until a render fails.
async function checkHeadlessCallsResolve(kernel) {
  const exported = new Set(Object.keys(kernel));
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\bkernel\.(\w+)/gu)].forEach(([, name]) => {
        check(
          exported.has(name),
          `${file} calls kernel.${name}, which @modules/rorschach does not export.`
        );
      });
    })
  );
}

// The reverse of the check below, and the one that actually caught something:
// eleven ink and pattern options shipped with no workbench control at all, so
// they were CLI-flag-only and untestable from the dev page. Verifying only that
// workbench fields name real options never notices that.
async function checkEveryOptionHasAControl() {
  const source = await readFile(WORKBENCH, 'utf8');
  const bound = new Set([
    ...[...source.matchAll(/option="(\w+)"/gu)].map(([, name]) => name),
    ...[...source.matchAll(/setOption\('(\w+)'/gu)].map(([, name]) => name),
  ]);

  ['still', 'video'].forEach((kind) => {
    optionsFor(kind, 'workbench').forEach(([key, spec]) => {
      if (key === 'out' || spec.cliOnly) return;
      check(
        bound.has(key),
        `"${key}" is a ${kind} option with no workbench control — it can only be reached as a CLI flag. Add a field, or mark it cliOnly if the job runner owns it.`
      );
    });
  });
}

async function checkWorkbenchFieldsExist() {
  const source = await readFile(WORKBENCH, 'utf8');
  const used = [...source.matchAll(/option="(\w+)"/gu)].map(([, name]) => name);
  check(
    used.length > 0,
    'no schema-bound fields found in the workbench — did NumberField change shape?'
  );
  used.forEach((name) => {
    check(
      name in RENDER_OPTIONS,
      `the workbench renders a field for "${name}", which is not in RENDER_OPTIONS.`
    );
  });
}

// The pattern is the ink layer's only pigment source — the trajectories no
// longer paint. So a zero default for the wash renders a bare background, and
// `--ink` with no other flags produces twenty blank stills with nothing in the
// logs to say why. That is exactly what happened when these defaults were
// carried over from the era when the trajectories were the paint and the
// pattern was an optional extra on top.
async function checkInkPaintsByDefault() {
  const sources = [
    ['inkPatternWash', 'how much pigment the pattern lays down'],
    ['inkPatternFlow', 'how wet it keeps the sheet'],
  ];
  sources.forEach(([key, what]) => {
    check(
      RENDER_OPTIONS[key]?.default > 0,
      `"${key}" defaults to ${RENDER_OPTIONS[key]?.default} — it is ${what}, and the pattern is the ink's only pigment source, so --ink alone would render a bare background.`
    );
  });

  const schema = await readFile(SCENE_CONTROLS, 'utf8');
  sources.forEach(([key]) => {
    check(
      !new RegExp(`p\\.${key} \\?\\? 0[,\\s]`, 'u').test(schema),
      `the scene schema falls back to 0 for "${key}", so a preset that omits it shows no ink at all.`
    );
  });
}

function checkSurfacesShareEveryOption() {
  ['still', 'video'].forEach((kind) => {
    const cli = new Set(optionsFor(kind).map(([key]) => key));
    optionsFor(kind, 'workbench').forEach(([key, spec]) => {
      check(
        cli.has(key) || spec.workbenchOnly,
        `"${key}" is offered to the workbench but is not a ${kind} CLI flag; mark it workbenchOnly if that is deliberate.`
      );
    });
  });
}

async function main() {
  await checkKernelPurity();
  await checkRenderOptionsIsStandalone();
  await checkWorkbenchFieldsExist();
  await checkEveryOptionHasAControl();
  await checkInkPaintsByDefault();
  checkSurfacesShareEveryOption();

  const kernel = await loadKernel();
  await checkHeadlessCallsResolve(kernel);

  if (failures.length > 0) {
    console.error(`rorschach:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exitCode = 1;
    return;
  }
  console.log('rorschach:check — kernel, CLIs and workbench agree.');
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
