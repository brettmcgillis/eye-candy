#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the IsoLines pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share (IsoLinesRelief's too),
// the contours must hold their invariants, and the flat rig must compile and
// draw both styles. See docs/iso-lines-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  SHAPE_KINDS,
  normalizeOptions,
} from '../src/modules/isoLines/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'isoLines');
const PRESETS = '/src/components/scenes/WebGPU/IsoLines/presets/presets.js';
const HEADLESS = [
  'lib/isoLinesRender.mjs',
  'iso-lines-generate.mjs',
  'iso-lines-video.mjs',
];
const BARRELS = {
  iso: '/src/modules/isoLines/index.js',
  look: '/src/modules/isoLinesRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/isoLines/components/OptionSections.jsx'
);
const RELIEF_DIR = path.join(REPO_ROOT, 'src', 'modules', 'isoLinesRelief');
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@utils/noise2d',
  '@utils/paletteStops',
]);
// Keys the camera rig owns; a preset may carry them but the schema does not.
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const DRIVERS = ['weightNoise', 'weightShape', 'weightImage', 'weightFocal'];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function checkPurity(dir, allowed) {
  const files = (await readdir(dir)).filter((name) =>
    /\.(js|mjs)$/u.test(name)
  );
  await Promise.all(
    files.map(async (name) => {
      const source = await readFile(path.join(dir, name), 'utf8');
      [...source.matchAll(/from '([^'.][^']*)'/gu)]
        .map(([, specifier]) => specifier)
        .filter((specifier) => !allowed.has(specifier))
        .forEach((specifier) =>
          failures.push(
            `kernel purity: ${path.basename(dir)}/${name} imports "${specifier}" — rendering code belongs in the render modules.`
          )
        );
    })
  );
}

function checkRigDefaults({ look, post }) {
  const { slots } = post.buildScenePostRuntimeConfig(look.ISO_LINES_POST);
  const slot = (id) => slots.find((entry) => entry.id === id);
  const expected = {
    postGradeEnabled: slot('grade')?.enabled,
    postGradeLetterbox: slot('grade')?.letterbox,
    postGradeTint: slot('grade')?.tint,
    postGradeVignette: slot('grade')?.vignette,
    postGrainAmount: slot('grain')?.amount,
    postGrainAnimated: slot('grain')?.animated,
    postGrainEnabled: slot('grain')?.enabled,
    postGrainScale: slot('grain')?.scale,
  };
  Object.entries(RENDER_OPTIONS)
    .filter(([, spec]) => spec.rig)
    .forEach(([name, spec]) => {
      check(
        name in expected,
        `"${name}" is a rig key the check does not know how to verify.`
      );
      check(
        spec.default === expected[name],
        `"${name}" defaults to ${spec.default} in renderOptions.mjs but the rig declares ${expected[name]}.`
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
    Object.entries(preset).forEach(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      if (spec?.type === 'number') {
        check(
          value >= spec.min && value <= spec.max,
          `preset "${name}" sets ${key} = ${value}, outside [${spec.min}, ${spec.max}] — Leva would clamp it.`
        );
      }
      if (spec?.type === 'enum') {
        check(
          spec.choices.includes(value),
          `preset "${name}" sets ${key} = "${value}", not one of its choices.`
        );
      }
    });
  });
}

// The contours are closed or end on the domain's edge, keep the higher
// ground on their left, and sit on their level.
function checkContours({ iso }) {
  const config = { ...iso.sceneDefaults(), resolution: 120 };
  const aspect = 1.25;
  const builder = iso.createIsoBuilder();
  const build = builder.build(config, { aspect, time: 2, withLines: true });
  const field = iso.createField(config, { aspect }).at(2);
  check(
    build.lines.length > 10,
    `the default field traced only ${build.lines.length} contours.`
  );
  const onEdge = (x, y) =>
    Math.abs(Math.abs(x) - aspect) < 1e-4 || Math.abs(Math.abs(y) - 1) < 1e-4;
  let misplaced = 0;
  let wrongSide = 0;
  build.lines.forEach(({ closed, level, points }) => {
    const n = points.length / 2;
    if (!closed) {
      check(
        onEdge(points[0], points[1]) &&
          onEdge(points[(n - 1) * 2], points[(n - 1) * 2 + 1]),
        `an open contour at ${level.toFixed(3)} ends inside the domain.`
      );
    }
    for (let i = 0; i + 1 < n; i += 1) {
      const ax = points[i * 2];
      const ay = points[i * 2 + 1];
      const bx = points[i * 2 + 2];
      const by = points[i * 2 + 3];
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const toUv = (x, y) => [(x + aspect) / 2, (y + 1) / 2];
      if (Math.abs(field(...toUv(mx, my)) - level) > 0.02) misplaced += 1;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const step = 0.004;
      const lx = mx - ((by - ay) / len) * step;
      const ly = my + ((bx - ax) / len) * step;
      if (field(...toUv(lx, ly)) < level - 1e-3) wrongSide += 1;
    }
  });
  const segments = build.lines.reduce((sum, l) => sum + l.points.length / 2, 0);
  check(
    misplaced < segments * 0.01,
    `${misplaced} of ${segments} contour segments sit off their level.`
  );
  check(
    wrongSide < segments * 0.02,
    `${wrongSide} of ${segments} contour segments have the higher ground on their right.`
  );

  const again = iso.createIsoBuilder().build(config, { aspect, time: 2 });
  check(
    again.values.every((v, i) => v === build.values[i]),
    'the same config built two different fields.'
  );
}

// Every driver alone makes a field that varies; both styles
// makes the geometry it should.
function checkDrivers({ iso }) {
  const base = {
    ...iso.sceneDefaults(),
    resolution: 80,
    trailSeconds: 0.25,
    trailSlices: 6,
  };
  const solo = Object.fromEntries(DRIVERS.map((key) => [key, 0]));
  const width = 32;
  const height = 24;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const v = (i % width) * 8;
    data.set([v, v, v, 255], i * 4);
  }
  const image = { channels: 4, data, height, width };
  const kinds = [
    ...SHAPE_KINDS.map((kind) => ['weightShape', { shapeKind: kind }]),
    ['weightNoise', {}],
    ['weightFocal', {}],
    ['weightImage', {}],
  ];
  kinds.forEach(([key, extra]) => {
    const config = { ...base, ...solo, [key]: 1, ...extra };
    const { values } = iso
      .createIsoBuilder()
      .build(config, { aspect: 1, image, time: 1 });
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    check(
      hi - lo > 0.1,
      `${key}${extra.shapeKind ? `:${extra.shapeKind}` : ''} alone is flat (${lo.toFixed(2)}..${hi.toFixed(2)}).`
    );
  });

  const image01 = iso.createIsoBuilder().build(
    { ...base, ...solo, weightImage: 1, imageBlur: 0 },
    {
      aspect: 1,
      image,
      time: 0,
    }
  );
  const row = image01.nx + 1;
  check(
    image01.values[row * 10 + image01.nx - 2] > image01.values[row * 10 + 2],
    'the image driver does not make bright ground high.'
  );

  ['walls', 'lines', 'trail'].forEach((mode) => {
    const build = iso
      .createIsoBuilder()
      .build(base, { aspect: 1, mode, time: 3 });
    check(build.segments.count > 0, `mode ${mode} builds no segments.`);
    if (mode === 'trail') {
      check(
        build.trail.slices.length === base.trailSlices - 1,
        `a fresh trail made ${build.trail.slices.length} past slices, not ${base.trailSlices - 1}.`
      );
    }
  });
  const flat = iso.createIsoBuilder().build(base, { aspect: 1, time: 3 });
  check(flat.segments === null, 'a flat build made segment geometry.');
}

// Every roll must be a config the scene accepts; a held facet must not move.
function checkRolls({ iso, look }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
  );
  for (let i = 0; i < 30; i += 1) {
    const config = iso.rollIsoLinesConfig(`check-${i}`, { palettes });
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    check(
      DRIVERS.some((key) => config[key] > 0),
      `roll check-${i} weights no driver.`
    );
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }
  const source = iso.rollIsoLinesConfig('b', { palettes });
  iso.facets().forEach((facet) => {
    const held = iso.rollIsoLinesConfig('a', {
      base: source,
      keep: [facet],
      palettes,
    });
    iso
      .keysInFacet(facet)
      .forEach((key) =>
        check(
          held[key] === source[key],
          `holding ${facet} still re-rolled "${key}".`
        )
      );
  });
}

function checkSvg({ iso }) {
  const config = iso.sceneDefaults();
  const build = iso
    .createIsoBuilder()
    .build(config, { aspect: 0.8, time: 0, withLines: true });
  const svg = iso.renderIsoSvg({
    aspect: 0.8,
    config,
    height: 500,
    lines: build.lines,
    width: 400,
  });
  check(
    (svg.match(/<path /gu) ?? []).length > 0,
    'the plot SVG of the default piece has no paths.'
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(iso|look|post)\.(\w+)/gu)]
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

// The flat rig must compile to valid WGSL and draw something other than
// the backdrop in both styles.
async function checkRender({ iso, look }, THREE) {
  const size = 128;
  const headless = await createHeadlessRenderer({ height: size, width: size });
  const { renderer } = headless;
  const { device } = renderer.backend;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const view = iso.flatView(1);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(...view.eye);
  camera.lookAt(...view.target);
  camera.updateMatrixWorld();
  const rig = look.createIsoRig();
  scene.add(rig.group);
  // eslint-disable-next-line no-restricted-syntax
  for (const style of ['terraced', 'lines']) {
    const config = {
      ...iso.sceneDefaults(),
      background: '#000000',
      resolution: 60,
      style,
    };
    rig.apply(config);
    rig.setBuild(iso.createIsoBuilder().build(config, { aspect: 1, time: 1 }));
    device.pushErrorScope('validation');
    // eslint-disable-next-line no-await-in-loop
    await headless.readFrame(() => renderer.render(scene, camera));
    // eslint-disable-next-line no-await-in-loop
    const frame = await headless.readFrame(() =>
      renderer.render(scene, camera)
    );
    // eslint-disable-next-line no-await-in-loop
    const error = await device.popErrorScope();
    check(
      !error,
      `the flat rig fails validation (${style}): ${error?.message}`
    );
    let marked = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 30) {
        marked += 1;
      }
    }
    check(
      marked > size * size * 0.05,
      `the default piece draws almost nothing (${style}).`
    );
  }
  rig.dispose();
  headless.dispose();
}

async function main() {
  await checkPurity(KERNEL_DIR, ALLOWED_KERNEL_IMPORTS);
  await checkPurity(
    RELIEF_DIR,
    new Set(['@modules/isoLines', ...ALLOWED_KERNEL_IMPORTS])
  );
  await checkPageFields();

  const { THREE } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkContours(barrels);
  checkDrivers(barrels);
  checkRolls(barrels);
  checkSvg(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);

  if (failures.length > 0) {
    console.error(`iso-lines:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'iso-lines:check — kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
