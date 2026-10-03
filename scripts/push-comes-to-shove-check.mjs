#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Push Comes to Shove pipeline: the scene, the CLIs and
// the workbench must agree with the kernel they share, the kernel's CPU
// mirrors must match the shaders, and the rig must compile, simulate and
// draw. See docs/push-comes-to-shove-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  MAX_POINTS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/pushComesToShove/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'pushComesToShove');
const PRESETS =
  '/src/components/scenes/WebGPU/PushComesToShove/presets/presets.js';
const HEADLESS = [
  'lib/pushComesToShoveRender.mjs',
  'push-comes-to-shove-generate.mjs',
  'push-comes-to-shove-video.mjs',
];
const BARRELS = {
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/pushComesToShoveRender/index.js',
  shove: '/src/modules/pushComesToShove/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/pushComesToShove/components/OptionSections.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@utils/noise2d',
  '@utils/paletteStops',
]);
const ASPECTS = { post: 1080 / 1350, reel: 1080 / 1920, square: 1 };
// Keys the camera rig owns; a preset may carry them but the schema does not.
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function checkKernelPurity() {
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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/pushComesToShoveRender.`
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

function checkRigDefaults({ lights, look }) {
  const { slots } = lights.buildSceneLightingRuntimeConfig({
    lighting: look.PUSH_LIGHTING,
  });
  const slot = (id) => slots.find((entry) => entry.id === id);
  const expected = {
    lightFillIntensity: slot('fill')?.intensity,
    lightHemiIntensity: slot('hemi')?.intensity,
    lightKeyAzimuth: slot('key')?.spherical?.azimuth,
    lightKeyColor: slot('key')?.color,
    lightKeyElevation: slot('key')?.spherical?.elevation,
    lightKeyIntensity: slot('key')?.intensity,
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

// Leva keeps a value a preset leaves out, so a preset that skips a control
// inherits it from whichever preset was showing before.
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
    Object.entries(preset)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `preset "${name}" sets ${key} = ${value}, outside [${min}, ${max}] — Leva would clamp it.`
        );
      });
    Object.entries(preset)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'enum')
      .forEach(([key, value]) =>
        check(
          RENDER_OPTIONS[key].choices.includes(value),
          `preset "${name}" sets ${key} = "${value}", not one of its choices.`
        )
      );
  });
}

const inRange = (config, label) =>
  Object.entries(config)
    .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
    .forEach(([key, value]) => {
      const { max, min } = RENDER_OPTIONS[key];
      check(
        value >= min && value <= max,
        `${label} sets ${key} = ${value}, outside [${min}, ${max}].`
      );
    });

// Every roll, fitted to every output format, must be a config the scene
// accepts and small enough for the solver.
function checkRolls({ look, shove }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 3
  );
  for (let i = 0; i < 40; i += 1) {
    const config = shove.rollShoveConfig(`check-${i}`, {
      palettes,
      stopsOf: look.getPaletteStops,
    });
    const spots = [config.faceTone, config.rimTone, config.cylinderTone];
    check(
      new Set(spots).size === 3,
      `roll check-${i} puts two of face, rim and cylinders on the same palette stop: ${spots.join(', ')}.`
    );
    inRange(config, `roll check-${i}`);
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
    Object.entries(ASPECTS).forEach(([format, aspect]) => {
      const fitted = shove.fitField(config, aspect);
      inRange(fitted, `roll check-${i} fitted to ${format}`);
      const { pointCount } = shove.computeLayout(fitted);
      check(
        pointCount <= MAX_POINTS,
        `roll check-${i} fitted to ${format} simulates ${pointCount} points, over ${MAX_POINTS}.`
      );
    });
  }
  const source = shove.rollShoveConfig('b', { palettes });
  const held = shove.rollShoveConfig('a', {
    base: source,
    keep: ['structure'],
    palettes,
  });
  shove
    .keysInFacet('structure')
    .forEach((key) =>
      check(
        held[key] === source[key],
        `holding structure still re-rolled "${key}".`
      )
    );
}

// Wires are laid out round the cylinders; one seeded inside a cylinder is
// flung out on the first frame.
function checkSeeding({ shove }) {
  ['seed-a', 'seed-b', 'seed-c'].forEach((seed) => {
    const config = shove.rollShoveConfig(seed);
    const layout = shove.computeLayout(config);
    const cylinders = shove.seedCylinders(config, layout);
    const { positions } = shove.seedWires(config, layout, cylinders.placed);
    const behind = shove.puckBackOf(config, layout) - layout.collideRadius;
    const depthInside = (i) =>
      Math.max(
        ...cylinders.placed.map(({ radius, x, y }) =>
          Math.min(
            radius +
              layout.collideRadius -
              Math.hypot(positions[i * 4] - x, positions[i * 4 + 1] - y),
            positions[i * 4 + 2] - behind
          )
        )
      );
    const worst = Array.from({ length: layout.pointCount }, (_, i) =>
      depthInside(i)
    ).reduce((a, b) => Math.max(a, b), 0);
    check(
      worst < layout.collideRadius * 0.5,
      `roll ${seed} seeds a wire ${worst.toFixed(3)} inside a puck.`
    );
  });
  const clip = shove.planClip({ fade: 1.5, fps: 30, hold: 8, mode: 'loop' });
  check(
    clip.holdFrames === 240 && clip.fadeFrames === 45 && clip.simFrames === 285,
    `planClip for an 8s hold with a 1.5s fade gave ${JSON.stringify(clip)}.`
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(shove|look|lights)\.(\w+)/gu)]
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

// The plot SVG's random pens come from the kernel's CPU copy of TSL `hash`;
// it must agree with the GPU on every wire and cylinder id.
async function checkHashMirror({ shove }, renderer, TSL) {
  const count = 4096;
  const seed = 417;
  const out = TSL.instancedArray(count, 'float');
  const kernel = TSL.Fn(() => {
    out
      .element(TSL.instanceIndex)
      .assign(
        TSL.hash(TSL.float(TSL.instanceIndex).mul(12.9898).add(TSL.float(seed)))
      );
  })().compute(count);
  await renderer.computeAsync(kernel);
  const gpu = new Float32Array(await renderer.getArrayBufferAsync(out.value));
  let mismatches = 0;
  for (let i = 0; i < count; i += 1) {
    if (gpu[i] !== Math.fround(shove.randomTone(i, seed))) mismatches += 1;
  }
  check(
    mismatches === 0,
    `randomTone disagrees with the shader's hash on ${mismatches} of ${count} ids.`
  );
}

// The rig must compile to valid WGSL, simulate without blowing up, and draw
// something other than the backdrop; its plot SVG must have line work.
async function checkRender({ lights, look, shove }, THREE) {
  const size = 128;
  const headless = await createHeadlessRenderer({ height: size, width: size });
  const { renderer } = headless;
  const { device } = renderer.backend;
  await checkHashMirror({ shove }, renderer, await import('three/tsl'));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const config = {
    ...shove.sceneDefaults(),
    paintCylinders: true,
    paintPanelRim: true,
    paintWires: true,
  };
  const rig = look.createShoveRig();
  rig.apply(config);
  scene.add(rig.group);
  scene.add(
    lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: look.PUSH_LIGHTING,
      }),
      { shadows: true }
    )
  );
  const layout = rig.layout();
  const view = shove.frameView({
    layout,
    options: {
      fov: 30,
      framing: 'panel',
      height: size,
      margin: 0,
      width: size,
    },
    view: 'front',
  });
  const camera = new THREE.PerspectiveCamera(view.fov, 1, view.near, view.far);
  camera.position.set(...view.eye);
  camera.lookAt(...view.target);

  device.pushErrorScope('validation');
  rig.warm(renderer, config, 2);
  await headless.readFrame(() => renderer.render(scene, camera));
  const frame = await headless.readFrame(() => renderer.render(scene, camera));
  const error = await device.popErrorScope();
  check(!error, `the rig fails validation: ${error?.message}`);

  let lit = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 12) lit += 1;
  }
  check(lit > size * size * 0.5, 'the default panel draws almost nothing.');

  const { bodies, wires } = await rig.readback(renderer);
  check(
    wires.every(Number.isFinite),
    'the wire simulation produced non-finite positions after 2s.'
  );
  check(
    bodies[3] > 0,
    'the first cylinder has no radius; cylinders must start full size.'
  );
  const svg = shove.renderShoveSvg({
    bodies,
    camera: view,
    config,
    height: size,
    layout,
    outlines: shove.holeOutlines(config, layout),
    stops: look.getPaletteStops(config.palette),
    width: size,
    wires,
  });
  check(
    (svg.match(/<path /gu) ?? []).length >= 3,
    'the plot SVG of the default panel is missing rim, wire or cylinder pens.'
  );
  rig.dispose();
  headless.dispose();
}

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  const { THREE } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkRolls(barrels);
  checkSeeding(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);

  if (failures.length > 0) {
    console.error(`push-comes-to-shove:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'push-comes-to-shove:check — kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
