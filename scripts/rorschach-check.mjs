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
