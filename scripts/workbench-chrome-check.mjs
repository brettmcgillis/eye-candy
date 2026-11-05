#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the render chrome every workbench shares: its sections come
// after the kernel's own, in one order, under one set of names. See
// docs/render-workbench.md §1.
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { SHARED_SECTIONS } from '../src/modules/optionSchema/index.mjs';
import { REPO_ROOT } from './lib/loadModules.mjs';
import { OVERLAY_TOOLS } from './lib/sceneIcons.mjs';

const RENAMED_KEYS = { holdSeconds: 'hold', seed: 'batch' };
const RENAMED_MODES = { stills: 'montage' };
const RENAMED_LABELS = {
  color: 'colour',
  lighting: 'light',
  'mode timing': 'video',
  roll: 'rolling',
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

function checkOrder(slug, kind, sections) {
  const ids = sections.map((section) => section.id);
  const firstShared = ids.findIndex((id) => SHARED_SECTIONS.includes(id));
  const shared = ids.filter((id) => SHARED_SECTIONS.includes(id));
  const expected = SHARED_SECTIONS.filter((id) => shared.includes(id));
  check(
    firstShared === -1 ||
      ids.slice(firstShared).every((id) => SHARED_SECTIONS.includes(id)),
    `${slug} ${kind}: a content section comes after the shared chrome (${ids.join(', ')}).`
  );
  check(
    shared.join() === expected.join(),
    `${slug} ${kind}: shared sections run ${shared.join(' → ')}, not ${expected.join(' → ')}.`
  );
}

function checkNames(slug, { RENDER_OPTIONS }) {
  const chrome = {
    holdSeconds: (spec) => spec.section === 'video',
    seed: (spec) => spec.section === 'output',
  };
  Object.entries(RENAMED_KEYS).forEach(([old, key]) =>
    check(
      !(RENDER_OPTIONS[old] && chrome[old](RENDER_OPTIONS[old])),
      `${slug}: "${old}" is a render option — name it "${key}" (standard.${key}) with aliases: ['${old}'].`
    )
  );
  Object.entries(RENAMED_MODES).forEach(([old, mode]) =>
    check(
      !RENDER_OPTIONS.mode?.choices?.includes(old),
      `${slug}: the "${old}" video mode is "${mode}".`
    )
  );
}

// One set of outputs: WebP + SVG stills, MP4 + WebM video, and transparency
// as the shared flag rather than a format or a per-kernel key.
// Benches whose subject is the whole frame, with nothing behind it to clear.
const FULL_FRAME = { imperfection: 'a painting, edge to edge' };

const RETIRED_OUTPUTS = {
  png: 'WebP (lossless) is the raster output',
  transparentBackground: 'use standard.transparent()',
};

function checkOutputs(slug, { RENDER_OPTIONS }) {
  Object.entries(RETIRED_OUTPUTS).forEach(([key, instead]) =>
    check(!RENDER_OPTIONS[key], `${slug}: "${key}" is retired — ${instead}.`)
  );
  check(
    RENDER_OPTIONS.webp?.scope === 'still',
    `${slug}: stills need standard.webp().`
  );
  const hasVideo = Object.values(RENDER_OPTIONS).some(
    (spec) => spec.scope === 'video'
  );
  ['mp4', 'webm'].forEach((format) =>
    check(
      !hasVideo || RENDER_OPTIONS[format]?.scope === 'video',
      `${slug}: video needs ${format} (...standard.videoFormats()).`
    )
  );
  Object.entries(RENDER_OPTIONS).forEach(([key, spec]) =>
    check(
      !spec.choices?.includes?.('transparent'),
      `${slug}: "${key}" offers a transparent choice — use standard.transparent().`
    )
  );
  check(
    RENDER_OPTIONS.svg?.scope === 'still',
    `${slug}: stills need standard.svg() — every bench plots (docs/render-workbench.md §0.3).`
  );
  check(
    !RENDER_OPTIONS.svg || RENDER_OPTIONS.svgColors?.section === 'svg',
    `${slug}: an SVG bench needs standard.svgColors() (inks for the Plotterizer).`
  );
  check(
    RENDER_OPTIONS.transparent || slug in FULL_FRAME,
    `${slug}: stills need standard.transparent() (or a FULL_FRAME entry saying why not).`
  );
  check(
    !RENDER_OPTIONS.transparent ||
      (RENDER_OPTIONS.transparent.section === 'output' &&
        RENDER_OPTIONS.transparent.scope === 'shared'),
    `${slug}: transparent must be standard.transparent().`
  );
}

function checkLabels(slug, kind, sections) {
  sections.forEach(({ id, label }) =>
    check(
      !(label in RENAMED_LABELS),
      `${slug} ${kind}: the ${id} section is labelled "${label}", not "${RENAMED_LABELS[label]}".`
    )
  );
}

// Every bench has a Live tab (docs/render-workbench.md §0.4): a three-only
// stage in `src/dev/tools/<tool>/live.js`, or an R3F one of its own.
const TOOL_DIRS = { trucheterie: 'trucheterie' };
const R3F_LIVE = {
  cumulus: 'LiveCumulus.jsx',
  'birds-arent-real': 'LiveFlock.jsx',
  rabbit: 'LiveRabbit.jsx',
  candle: 'LiveCandle.jsx',
  'dumpster-fire': 'LiveDumpster.jsx',
  'ghost-buster': 'LiveGhost.jsx',
};
// Bespoke pages still to port (plans/renderWorkbenchAlignment.md, Phase 3).
const LIVE_PENDING = new Set(['flora', 'rorschach']);

function checkLive(slug, module, { RENDER_OPTIONS }) {
  if (LIVE_PENDING.has(slug)) return;
  const dir = path.join(REPO_ROOT, 'src/dev/tools', TOOL_DIRS[slug] ?? module);
  check(
    existsSync(path.join(dir, R3F_LIVE[slug] ?? 'live.js')),
    `${slug}: no Live tab — add src/dev/tools/${TOOL_DIRS[slug] ?? module}/live.js.`
  );
  check(
    RENDER_OPTIONS.capture?.cliOnly && RENDER_OPTIONS.capture.scope === 'still',
    `${slug}: a Live tab needs standard.capture() so its captures finish.`
  );
}

await Promise.all(
  Object.entries(OVERLAY_TOOLS).map(async ([slug, { module }]) => {
    const schema = await import(
      path.join(REPO_ROOT, 'src/modules', module, 'renderOptions.mjs')
    );
    checkNames(slug, schema);
    checkOutputs(slug, schema);
    checkLive(slug, module, schema);
    ['still', 'video'].forEach((kind) => {
      const sections = schema.sectionsFor(kind, 'workbench');
      checkOrder(slug, kind, sections);
      checkLabels(slug, kind, sections);
    });
  })
);

if (failures.length > 0) {
  console.error(`workbench chrome check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `workbench chrome check: ${Object.keys(OVERLAY_TOOLS).length} workbenches share one order and one set of names (${SHARED_SECTIONS.join(' → ')}) and one set of outputs (WebP + SVG, MP4 + WebM).`
);
