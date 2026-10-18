#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the render chrome every workbench shares: its sections come
// after the kernel's own, in one order, under one set of names. See
// docs/render-workbench.md §1.
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

function checkLabels(slug, kind, sections) {
  sections.forEach(({ id, label }) =>
    check(
      !(label in RENAMED_LABELS),
      `${slug} ${kind}: the ${id} section is labelled "${label}", not "${RENAMED_LABELS[label]}".`
    )
  );
}

await Promise.all(
  Object.entries(OVERLAY_TOOLS).map(async ([slug, { module }]) => {
    const schema = await import(
      path.join(REPO_ROOT, 'src/modules', module, 'renderOptions.mjs')
    );
    checkNames(slug, schema);
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
  `workbench chrome check: ${Object.keys(OVERLAY_TOOLS).length} workbenches share one order and one set of names (${SHARED_SECTIONS.join(' → ')}).`
);
