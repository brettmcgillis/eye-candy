#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Rug Pull pipeline: the schema must mirror the kernel's
// id lists, the kernel must stay three-free, presets and rolls must be valid
// configs, every design must weave (deterministically) with and without the
// house motifs, the cloth must settle, and the rig must draw headlessly.
// See docs/rug-pull-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/rugPull/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import { createRugCapturer, drape, loadKernel } from './lib/rugPullRender.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'rugPull');
const PRESETS = '/src/components/scenes/WebGPU/RugPull/presets/presets.js';
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@utils/argylePattern',
]);
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const HOUSE = {
  mineBorder: 1,
  mineField: 0.4,
  mineGuard: 1,
  mineMedallion: 1,
  mineSignature: 1,
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const same = (a, b) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

async function checkPurity() {
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
            `kernel purity: rugPull/${name} imports "${specifier}".`
          )
        );
    })
  );
}

function checkValue(where, key, value) {
  const spec = RENDER_OPTIONS[key];
  if (!spec) {
    check(CAMERA_KEY.test(key), `${where}: unknown key ${key}.`);
    return;
  }
  if (spec.type === 'number') {
    check(
      typeof value === 'number' && value >= spec.min && value <= spec.max,
      `${where}: ${key}=${value} is outside ${spec.min}..${spec.max} (Leva would clamp it).`
    );
  } else if (spec.type === 'enum') {
    check(
      spec.choices.includes(value),
      `${where}: ${key}=${value} is not a choice.`
    );
  }
}

function checkWeave(rug, config, label) {
  const build = rug.buildRug(config);
  const knots = build.cols * build.rows;
  check(build.roles.length === knots, `${label}: role grid is the wrong size.`);
  check(build.rgba.length === knots * 4, `${label}: rgba is the wrong size.`);
  check(
    build.roles.every((role) => role < build.colors.length),
    `${label}: a knot holds a role outside the palette.`
  );
  const field = new Set();
  for (let y = Math.floor(build.field.y0); y < build.field.y1; y += 1) {
    for (let x = Math.floor(build.field.x0); x < build.field.x1; x += 1) {
      field.add(build.roles[y * build.cols + x]);
    }
  }
  check(
    field.size >= 3,
    `${label}: the field is nearly one colour (${field.size} yarns).`
  );
  const again = rug.buildRug(config);
  check(
    Buffer.compare(Buffer.from(build.rgba), Buffer.from(again.rgba)) === 0,
    `${label}: weaving is not deterministic.`
  );
  return build;
}

async function main() {
  const kernel = await loadKernel();
  const { look, rug } = kernel;

  check(
    same(rug.DESIGN_CHOICES, rug.DESIGN_IDS),
    'schema DESIGN_CHOICES differs from the kernel designs.'
  );
  check(
    same(rug.BORDER_CHOICES, rug.BORDER_IDS),
    'schema BORDER_CHOICES differs from the kernel borders.'
  );
  check(
    same(rug.GUARD_CHOICES, rug.GUARD_IDS),
    'schema GUARD_CHOICES differs from the kernel guards.'
  );
  check(
    same(rug.PALETTE_CHOICES, rug.PALETTE_IDS),
    'schema PALETTE_CHOICES differs from the kernel palettes.'
  );
  check(
    same(rug.ROLE_NAMES, rug.ROLES),
    'schema ROLE_NAMES differs from the kernel roles.'
  );
  await checkPurity();

  const { PRESETS: presets } = (await loadModules([PRESETS]))[PRESETS];
  Object.entries(presets).forEach(([name, preset]) => {
    Object.entries(preset).forEach(([key, value]) =>
      checkValue(`preset "${name}"`, key, value)
    );
    SCENE_KEYS.forEach((key) =>
      check(key in preset, `preset "${name}" lacks ${key}.`)
    );
    checkWeave(rug, preset, `preset "${name}"`);
  });

  const defaults = rug.sceneDefaults();
  rug.DESIGN_IDS.forEach((design) => {
    [1, 2].forEach((rugSeed) => {
      checkWeave(
        rug,
        { ...defaults, design, rugSeed },
        `${design} #${rugSeed}`
      );
      checkWeave(
        rug,
        { ...defaults, ...HOUSE, design, rugSeed },
        `${design} #${rugSeed} house`
      );
    });
  });

  for (let i = 0; i < 24; i += 1) {
    const config = rug.rollRugConfig(`check-${i}`, { houseRate: 0.5 });
    Object.entries(config).forEach(([key, value]) =>
      checkValue(`roll ${i}`, key, value)
    );
  }
  const held = rug.rollRugConfig('a', {});
  const moved = rug.rollRugConfig('b', { base: held, keep: ['palette'] });
  check(
    moved.palette === held.palette,
    'holding the palette facet did not keep the palette.'
  );
  check(
    rug.rollRugConfig('c', { pinned: { design: 'gul' } }).design === 'gul',
    'a pinned design was rolled over.'
  );

  try {
    normalizeOptions('still', { views: 'cartoon,nope' });
    failures.push('normalizeOptions accepted an unknown view.');
  } catch {
    // expected
  }

  const sample = { ...defaults, design: 'village', knotsAcross: 120 };
  const woven = { build: rug.buildRug(sample), config: sample };
  ['floor', 'wall'].forEach((mode) => {
    const { cloth } = drape(kernel, woven, mode, 240);
    check(
      cloth.positions.every(Number.isFinite),
      `cloth (${mode}) went non-finite.`
    );
  });

  const capturer = await createRugCapturer(kernel, {
    height: 128,
    samples: 0,
    width: 128,
  });
  try {
    capturer.load(woven);
    const draped = drape(kernel, woven, 'floor', 60);
    const frame = await capturer.capture(
      rug.floorView(woven.build, sample, 1),
      draped,
      { config: sample, mode: 'floor' }
    );
    let min = 255;
    let max = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      min = Math.min(min, frame.data[i]);
      max = Math.max(max, frame.data[i]);
    }
    check(max - min > 40, `the rig rendered a flat frame (${min}..${max}).`);
  } finally {
    capturer.dispose();
  }
  check(
    typeof look.createRugRig === 'function',
    'rugPullRender lost createRugRig.'
  );

  if (failures.length) {
    console.error(`rug-pull:check failed (${failures.length}):`);
    failures.forEach((message) => console.error(`  - ${message}`));
    process.exit(1);
  }
  console.log('rug-pull:check passed');
  process.exit(0);
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exit(1);
});
