#!/usr/bin/env node

/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax, import/no-extraneous-dependencies */
// Drift alarm for the Live tabs (docs/render-workbench.md §0.4): every
// bench's `src/dev/tools/<tool>/live.js` is run against the headless
// renderer exactly as LiveStage runs it in the page — build the stage, roll
// a generation, frame it, capture a frame (and its plot) — and the frame
// must have drawn something. `npm run live:check [tool…]`.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const TOOLS = path.join(REPO_ROOT, 'src/dev/tools');
const SIZE = 160;

async function loadImage(source, max = 1024) {
  if (!source) return null;
  const inPublic = path.join(REPO_ROOT, 'public', source.replace(/^\//u, ''));
  const { data, info } = await sharp(existsSync(inPublic) ? inPublic : source)
    .rotate()
    .resize(max, max, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { channels: 4, data, height: info.height, width: info.width };
}

async function rasterize(svg, { height, width }) {
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height, width: info.width };
}

const drewSomething = ({ data }) => {
  let lo = 255;
  let hi = 0;
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] + data[i + 1] + data[i + 2];
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return hi - lo > 24;
};

// ez-tree (brutalist) builds its bark and leaf images at import time, so it
// is imported once under a stub document before any live.js reaches it.
async function preloadTree() {
  const image = () => ({
    addEventListener() {},
    removeEventListener() {},
    style: {},
  });
  globalThis.document = { createElement: image, createElementNS: image };
  try {
    await import('@dgreenheck/ez-tree');
  } finally {
    delete globalThis.document;
  }
}

const asked = process.argv.slice(2);
const tools = readdirSync(TOOLS).filter(
  (tool) =>
    existsSync(path.join(TOOLS, tool, 'live.js')) &&
    (asked.length === 0 || asked.includes(tool))
);

// One process per bench: Dawn's devices and the module graph outgrow one
// Node heap across every bench.
if (tools.length > 1) {
  const failed = tools.filter(
    (tool) =>
      spawnSync(process.execPath, [process.argv[1], tool], {
        stdio: 'inherit',
      }).status !== 0
  );
  if (failed.length) {
    console.error(`live check failed: ${failed.join(', ')}`);
    process.exit(1);
  }
  console.log(
    `live check: ${tools.length} Live tabs build, roll, frame and capture.`
  );
  process.exit(0);
}

await loadThree();
await preloadTree();

async function runOnce(bench, options) {
  const headless = await createHeadlessRenderer({ height: SIZE, width: SIZE });
  const stage = await bench.createStage({
    loadImage,
    options,
    rasterize,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
  });
  const generated = await bench.generate({
    loadImage,
    options,
    pinned: new Set(),
    seed: 7,
  });
  const { drawn, layout } = bench.load
    ? await bench.load({ drawn: generated, options, stage })
    : { drawn: generated, layout: await stage.load(generated) };
  await stage.settle?.(options);
  stage.step?.(1 / 60);
  const view = bench.frame({ drawn, layout, options });
  const image = await stage.capture(view);
  const visible =
    options.svgOcclusion && stage.captureDepth
      ? stage.depthProbe(await stage.captureDepth(view))
      : null;
  const svg = stage.svg ? await stage.svg(view, options, visible) : null;
  stage.dispose();
  headless.dispose();
  const problems = [
    image?.data ? null : 'capture returned no frame',
    image?.data && !drewSomething(image)
      ? 'the frame is one flat colour'
      : null,
    stage.svg && !/<path/u.test(svg ?? '') ? 'the plot drew no paths' : null,
    bench.configOf(drawn) ? null : 'configOf returned nothing',
  ].filter(Boolean);
  return { name: bench.name(drawn), problems };
}

const failures = [];
for (const tool of tools) {
  const entry = `/src/dev/tools/${tool}/live.js`;
  try {
    const { [entry]: live } = await loadModules([entry]);
    const bench = live.default;
    const schema = await import(
      path.join(
        REPO_ROOT,
        'src/modules',
        bench.module ?? tool,
        'renderOptions.mjs'
      )
    );
    const base = {
      ...schema.defaultsFor('still', 'workbench'),
      height: SIZE,
      pixelRatio: 1,
      svg: true,
      width: SIZE,
    };
    // `checks`: extra option sets a bench's stage branches on.
    for (const extra of [{}, ...(bench.checks ?? [])]) {
      const label = [tool, ...Object.values(extra)].join(' ');
      const { name, problems } = await runOnce(bench, { ...base, ...extra });
      if (problems.length) failures.push(`${label}: ${problems.join('; ')}`);
      else console.log(`ok ${label} (${name})`);
    }
  } catch (error) {
    failures.push(`${tool}: ${error.stack ?? error}`);
  }
}
if (failures.length) {
  console.error(`live check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `live check: ${tools.length} Live tabs build, roll, frame and capture.`
);
process.exit(0);
