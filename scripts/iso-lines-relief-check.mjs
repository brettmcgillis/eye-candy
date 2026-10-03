#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the IsoLinesRelief pipeline: the scene, the CLIs and the
// workbench must agree with the relief schema, every style and wall mode
// must build its geometry, and the rig must compile and draw each of them.
// The shared kernel's invariants live in iso-lines:check. See
// docs/iso-lines-relief-pipeline.md.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/isoLinesRelief/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const PRESETS =
  '/src/components/scenes/WebGPU/IsoLinesRelief/presets/presets.js';
const HEADLESS = [
  'lib/isoLinesReliefRender.mjs',
  'iso-lines-relief-generate.mjs',
  'iso-lines-relief-video.mjs',
];
const BARRELS = {
  iso: '/src/modules/isoLines/index.js',
  look: '/src/modules/isoLinesReliefRender/index.js',
  post: '/src/modules/postRig/index.js',
  relief: '/src/modules/isoLinesRelief/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/isoLinesRelief/components/OptionSections.jsx'
);
// Keys the camera rig owns; a preset may carry them but the schema does not.
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const DRIVERS = ['weightNoise', 'weightShape', 'weightImage', 'weightFocal'];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

function checkRigDefaults({ look, post }) {
  const { slots } = post.buildScenePostRuntimeConfig(
    look.ISO_LINES_RELIEF_POST
  );
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

// Every style and wall mode builds the geometry its rig draws.
function checkGeometry({ iso, relief }) {
  const base = { ...relief.sceneDefaults(), resolution: 80 };
  const modes = [
    [{ style: 'terraced', wallMode: 'solid' }, 'walls'],
    [{ style: 'terraced', wallMode: 'floating' }, null],
    [{ style: 'smooth' }, null],
    [{ lineExtrude: 'height', style: 'lines' }, 'lines'],
    [{ lineExtrude: 'time', style: 'lines' }, 'trail'],
  ];
  modes.forEach(([extra, expected]) => {
    const config = { ...base, ...extra };
    const mode = relief.segmentMode(config);
    check(
      mode === expected,
      `${JSON.stringify(extra)} asks for ${mode}, not ${expected}.`
    );
    const build = iso
      .createIsoBuilder()
      .build(config, { aspect: 1, mode, time: 3 });
    if (mode) {
      check(
        build.segments.count > 0,
        `${JSON.stringify(extra)} builds no segments.`
      );
    }
  });
}

// Every roll must be a config the scene accepts; a held facet must not move.
function checkRolls({ look, relief }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
  );
  for (let i = 0; i < 30; i += 1) {
    const config = relief.rollIsoLinesReliefConfig(`check-${i}`, {
      palettes,
    });
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
  const source = relief.rollIsoLinesReliefConfig('b', { palettes });
  relief.facets().forEach((facet) => {
    const held = relief.rollIsoLinesReliefConfig('a', {
      base: source,
      keep: [facet],
      palettes,
    });
    relief
      .keysInFacet(facet)
      .forEach((key) =>
        check(
          held[key] === source[key],
          `holding ${facet} still re-rolled "${key}".`
        )
      );
  });
}

function checkCycle({ relief }) {
  const config = {
    ...relief.sceneDefaults(),
    buildSeconds: 2,
    holdSeconds: 1,
  };
  check(
    relief.cycleAt(0, config) === 0 &&
      relief.cycleAt(2, config) === 1 &&
      relief.cycleAt(2.5, config) === 1 &&
      relief.cycleAt(5, config) === 0,
    'the build cycle does not rise, hold and fall back.'
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(iso|look|post|relief)\.(\w+)/gu)]
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

// The rig must compile to valid WGSL and draw something other than the
// backdrop for every style, flat and in relief.
async function checkRender({ iso, look, relief }, THREE) {
  const size = 128;
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      // eslint-disable-next-line no-param-reassign
      renderer.shadowMap.enabled = true;
    },
    height: size,
    width: size,
  });
  const { renderer } = headless;
  const { device } = renderer.backend;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50),
    perspective: new THREE.PerspectiveCamera(30, 1, 0.1, 50),
  };
  const rig = look.createReliefRig();
  scene.add(rig.group);
  const cases = [
    { style: 'terraced', wallMode: 'solid' },
    { style: 'terraced', wallMode: 'floating' },
    { style: 'smooth' },
    { style: 'smooth', terraceSharpness: 0.9 },
    { lineExtrude: 'height', style: 'lines' },
    { lineExtrude: 'time', style: 'lines' },
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const extra of cases) {
    const config = {
      ...relief.sceneDefaults(),
      ...extra,
      background: '#000000',
      resolution: 60,
    };
    const build = iso.createIsoBuilder().build(config, {
      aspect: 1,
      mode: relief.segmentMode(config),
      time: 1,
    });
    const view = relief.frameView({
      aspect: 1,
      config,
      options: {
        fov: 30,
        height: size,
        margin: 0.05,
        projection: 'perspective',
        width: size,
      },
      view: 'hero',
    });
    const camera = cameras[view.projection];
    if (view.projection === 'orthographic') {
      Object.assign(camera, {
        bottom: -view.halfHeight,
        left: -view.halfWidth,
        right: view.halfWidth,
        top: view.halfHeight,
      });
    } else camera.fov = view.fov;
    camera.near = view.near;
    camera.far = view.far;
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    rig.apply(config);
    rig.setBuild(build);
    rig.setTime(build.time);
    device.pushErrorScope('validation');
    // eslint-disable-next-line no-await-in-loop
    await headless.readFrame(() => renderer.render(scene, camera));
    // eslint-disable-next-line no-await-in-loop
    const frame = await headless.readFrame(() =>
      renderer.render(scene, camera)
    );
    // eslint-disable-next-line no-await-in-loop
    const error = await device.popErrorScope();
    const label = JSON.stringify(extra);
    check(!error, `the rig fails validation (${label}): ${error?.message}`);
    let marked = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 30) {
        marked += 1;
      }
    }
    check(
      marked > size * size * 0.05,
      `the default piece draws almost nothing (${label}).`
    );
  }
  rig.dispose();
  headless.dispose();
}

async function main() {
  await checkPageFields();

  const { THREE } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkGeometry(barrels);
  checkRolls(barrels);
  checkCycle(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);

  if (failures.length > 0) {
    console.error(`iso-lines-relief:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'iso-lines-relief:check — schema, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
