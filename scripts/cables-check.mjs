#!/usr/bin/env node

/* eslint-disable no-console, no-new-func, class-methods-use-this, import/no-extraneous-dependencies */
// Drift alarm for the Cables pipeline: the kernel's walk must still be the
// Hair turtle stroke for stroke, rolls and presets must be configs the scene
// accepts, the scene, CLIs and workbench must agree with the kernel, and the
// rig must compile and draw. See docs/cables-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/cables/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import presetKeys from './lib/presetKeys.mjs';
import schemaControlCoverage from './lib/schemaControlCoverage.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const SCENE = 'src/components/scenes/WebGPU/Cables';
const CONTROLS = [`/${SCENE}/utils/controls.js`];
const PRESETS = `/${SCENE}/presets/presets.js`;
const REFERENCE = path.join(REPO_ROOT, SCENE, 'references/hair.turtle');
const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'cables');
const HEADLESS = [
  'lib/cablesRender.mjs',
  'cables-generate.mjs',
  'cables-video.mjs',
];
const BARRELS = {
  cables: '/src/modules/cables/index.js',
  flora: '/src/modules/flora/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/cablesRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/cables/CablesWorkbenchPage.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@modules/plotKit',
  '@utils/paletteStops',
]);
const REGISTERED_PRESET_KEYS = await presetKeys('Cables');

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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/cablesRender.`
          )
        );
    })
  );
}

// The reference, run under a stub Turtle with Math.random swapped for the
// kernel's stream, against the kernel's flat walk with the reference's
// values: every strand, every step.
async function checkTurtlePort({ cables, flora }) {
  const source = await readFile(REFERENCE, 'utf8');
  const strands = [];
  const MAX = 20000;
  class Turtle {
    constructor() {
      Object.assign(this, { h: 0, x: 0, y: 0 });
    }

    up() {}

    down() {
      strands.push([this.x, this.y]);
    }

    goto(x, y) {
      Object.assign(this, { x, y });
    }

    xcor() {
      return this.x;
    }

    ycor() {
      return this.y;
    }

    seth(h) {
      this.h = h;
    }

    forward(d) {
      const r = (this.h * Math.PI) / 180;
      this.x += d * Math.cos(r);
      this.y += d * Math.sin(r);
      const strand = strands[strands.length - 1];
      strand.push(this.x, this.y);
      if (strand.length > MAX * 2) throw new Error('runaway strand');
    }
  }
  const seed = 'cables-check';
  const { random } = Math;
  Math.random = flora.createRng(seed);
  try {
    const walk = new Function('Turtle', 'Canvas', `${source}\nreturn walk;`)(
      Turtle,
      { setpenopacity() {} }
    );
    let i = 0;
    while (walk(i)) i += 1;
  } finally {
    Math.random = random;
  }
  const ours = cables.walkStrands(
    {
      bound: cables.CANVAS,
      layout: 'flat',
      maxSteps: MAX,
      noiseScale: 0.02,
      octaves: 10,
      step: 0.5,
      strands: 720,
      turn: 1368,
    },
    flora.createRng(seed)
  );
  check(
    ours.length === strands.length,
    `the port walks ${ours.length} strands, the turtle ${strands.length}.`
  );
  let worst = 0;
  let mismatched = 0;
  ours.forEach((strand, k) => {
    const ref = strands[k] ?? [];
    if (ref.length / 2 !== strand.length / 3) mismatched += 1;
    for (let j = 0; j < Math.min(ref.length / 2, strand.length / 3); j += 1)
      worst = Math.max(
        worst,
        Math.abs(strand[j * 3] - ref[j * 2]),
        Math.abs(strand[j * 3 + 2] - ref[j * 2 + 1])
      );
  });
  check(
    mismatched === 0,
    `${mismatched} strands differ in length from the turtle's.`
  );
  check(worst < 1e-6, `the port strays ${worst} canvas units from the turtle.`);
}

function checkRigDefaults({ lights, look, post }) {
  const lighting = lights.buildSceneLightingRuntimeConfig({
    lighting: look.CABLES_LIGHTING,
  });
  const key = lighting.slots.find((entry) => entry.id === 'key');
  const { slots } = post.buildScenePostRuntimeConfig(look.CABLES_POST);
  const bloom = slots.find((entry) => entry.id === 'bloom');
  const grade = slots.find((entry) => entry.id === 'grade');
  const expected = {
    lightKeyAzimuth: key?.spherical?.azimuth,
    lightKeyColor: key?.color,
    lightKeyElevation: key?.spherical?.elevation,
    lightKeyIntensity: key?.intensity,
    postBloomEnabled: bloom?.enabled,
    postBloomStrength: bloom?.strength,
    postBloomThreshold: bloom?.threshold,
    postGradeEnabled: grade?.enabled,
    postGradeLetterbox: grade?.letterbox,
    postGradeTint: grade?.tint,
    postGradeVignette: grade?.vignette,
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

function checkPresets({ PRESETS: presets }) {
  const scene = new Set(SCENE_KEYS);
  Object.entries(presets).forEach(([name, preset]) => {
    Object.keys(preset)
      .filter((key) => !scene.has(key) && !REGISTERED_PRESET_KEYS.has(key))
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

// Every roll must be a config the scene accepts, and holding a facet must
// hold it.
function checkRolls({ cables, look }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
  );
  for (let i = 0; i < 40; i += 1) {
    const config = cables.rollCablesConfig(`check-${i}`, { palettes });
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }
  const source = cables.rollCablesConfig('b', { palettes });
  ['field', 'cables', 'atmosphere'].forEach((facet) => {
    const held = cables.rollCablesConfig('a', {
      base: source,
      keep: [facet],
      palettes,
    });
    cables
      .keysInFacet(facet)
      .forEach((key) =>
        check(
          held[key] === source[key],
          `holding ${facet} still re-rolled "${key}".`
        )
      );
  });
}

// Both layouts build, deterministically, every cable out of the hole and
// the flat lay touching the floor.
function checkLayouts({ cables }) {
  ['flat', 'tangle'].forEach((layout) => {
    const config = { ...cables.sceneDefaults(), layout, strands: 120 };
    const a = cables.buildCables(config);
    const b = cables.buildCables(config);
    check(
      a.cables.length === 120,
      `${layout}: built ${a.cables.length} cables for 120 strands.`
    );
    check(
      a.cables.every(
        ({ points }, i) =>
          points.length === b.cables[i].points.length &&
          points.every((v, k) => v === b.cables[i].points[k])
      ),
      `${layout}: two builds of one config differ.`
    );
    check(
      a.cables.every(({ points }) => points.every(Number.isFinite)),
      `${layout}: a cable has a non-finite point.`
    );
    check(
      a.cables.every(({ points }) => points[1] < 0),
      `${layout}: a cable does not start down the hole.`
    );
    const lowest = Math.min(
      ...a.cables.map(({ points }) => {
        let low = Infinity;
        for (let i = 1; i < points.length; i += 3)
          if (
            points[i] >= 0 &&
            Math.hypot(points[i - 1], points[i + 1]) > a.hole
          )
            low = Math.min(low, points[i]);
        return low;
      })
    );
    check(
      lowest >= a.radius * 0.99,
      `${layout}: a cable sinks into the floor (${lowest}).`
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
      [...source.matchAll(/\b(?:kernel\.)?(cables|look|lights|post)\.(\w+)/gu)]
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

// The stage and its post chain must compile to valid WGSL and draw cables
// over the floor.
async function checkRender({ cables, look }) {
  const size = 128;
  const headless = await createHeadlessRenderer({ height: size, width: size });
  const stage = look.createCablesStage({
    height: size,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
    width: size,
  });
  const config = { ...cables.sceneDefaults(), strands: 60 };
  const drawn = {
    config,
    generation: cables.buildCables(config),
    name: 'check',
  };
  const bounds = stage.load(drawn);
  const options = {
    ...cables.defaultsFor('cli-still'),
    height: size,
    width: size,
  };
  const { device } = headless.renderer.backend;
  device.pushErrorScope('validation');
  const frame = await stage.capture(
    cables.frameView({ bounds, options, view: 'top' })
  );
  const error = await device.popErrorScope();
  check(!error, `the stage fails validation: ${error?.message}`);
  const backdrop = frame.data[0] + frame.data[1] + frame.data[2];
  let dark = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] < backdrop * 0.6)
      dark += 1;
  }
  check(dark > size * size * 0.02, 'the default cables draw almost nothing.');
  if (process.env.CABLES_CHECK_FRAME) {
    const { default: sharp } = await import('sharp');
    await sharp(Buffer.from(frame.data.buffer ?? frame.data), {
      raw: { channels: 4, height: frame.height, width: frame.width },
    })
      .png()
      .toFile(process.env.CABLES_CHECK_FRAME);
  }
  stage.dispose();
  headless.dispose();
}

async function main() {
  await checkKernelPurity();
  await checkWorkbenchPage(PAGE_FIELDS, RENDER_OPTIONS, check);

  await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  await checkTurtlePort(barrels);
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkRolls(barrels);
  checkLayouts(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels);

  failures.push(...(await schemaControlCoverage(CONTROLS)));
  if (failures.length > 0) {
    console.error(`cables:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'cables:check — turtle port, kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
