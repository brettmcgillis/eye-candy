#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Apollian pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share, the GPU fields must carve
// the same solid as their CPU mirrors, and every family's material must
// compile and draw. See docs/apollian-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  FAMILIES,
  LEVA_KEYS,
  MATERIALS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/apollian/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'apollian');
const PRESETS = '/src/components/scenes/WebGPU/Apollian/presets/presets.js';
const HEADLESS = [
  'lib/apollianRender.mjs',
  'apollian-generate.mjs',
  'apollian-video.mjs',
];
const BARRELS = {
  apollian: '/src/modules/apollian/index.js',
  look: '/src/modules/apollianRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/apollian/components/OptionSections.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@modules/isoLines',
  '@utils/paletteStops',
]);
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const PARITY_SIZE = 96;
const PARITY_AGREEMENT = 0.97;

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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/apollianRender.`
          )
        );
    })
  );
}

function checkRigDefaults({ look, post }) {
  const { slots } = post.buildScenePostRuntimeConfig(look.APOLLIAN_POST);
  const bloom = slots.find((entry) => entry.id === 'bloom');
  const grade = slots.find((entry) => entry.id === 'grade');
  const expected = {
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

function checkRolls({ apollian, look }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 3
  );
  const seen = new Set();
  for (let i = 0; i < 24; i += 1) {
    const config = apollian.rollApollianConfig(`check-${i}`, { palettes });
    seen.add(config.family);
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
  check(seen.size === FAMILIES.length, `24 rolls only reached ${[...seen]}.`);
  const source = apollian.rollApollianConfig('b', { palettes });
  const held = apollian.rollApollianConfig('a', {
    base: source,
    keep: ['form'],
    palettes,
  });
  apollian
    .keysInFacet('form')
    .forEach((key) =>
      check(held[key] === source[key], `holding form still re-rolled "${key}".`)
    );
}

// The packing must be exact: spheres inside the ball and never overlapping.
function checkPacking({ apollian }) {
  const config = { ...apollian.sceneDefaults(), classicMaxSpheres: 800 };
  const { spheres } = apollian.packingFor(config);
  const n = spheres.length / apollian.PACKING_STRIDE;
  let overlap = 0;
  let outside = 0;
  for (let i = 0; i < n; i += 1) {
    const a = i * apollian.PACKING_STRIDE;
    outside = Math.max(
      outside,
      Math.hypot(spheres[a], spheres[a + 1], spheres[a + 2]) +
        spheres[a + 3] -
        1
    );
    for (let j = i + 1; j < n; j += 1) {
      const b = j * apollian.PACKING_STRIDE;
      const gap =
        Math.hypot(
          spheres[a] - spheres[b],
          spheres[a + 1] - spheres[b + 1],
          spheres[a + 2] - spheres[b + 2]
        ) -
        spheres[a + 3] -
        spheres[b + 3];
      overlap = Math.min(overlap, gap);
    }
  }
  check(n > 100, `the packing kept only ${n} spheres.`);
  check(overlap > -1e-5, `packed spheres overlap by ${-overlap}.`);
  check(outside < 1e-5, `a packed sphere leaves the ball by ${outside}.`);
}

function checkPlots({ apollian, look }) {
  const options = { svgPens: 4, svgResolution: 160, svgStroke: 0.6 };
  [
    { family: 'apollian4', sliceMode: 'bands', svgStyle: 'pens' },
    {
      family: 'disc',
      sliceMode: 'stack',
      svgStyle: 'outline',
      sliceElevation: 90,
      fieldScale: 1.34,
    },
    {
      family: 'kleinian',
      sliceMode: 'section',
      svgStyle: 'hatch',
      fieldScale: 1.2,
      sliceOffset: 0.2,
    },
    {
      family: 'classic',
      sliceMode: 'section',
      svgStyle: 'pens',
      classicMaxSpheres: 600,
    },
  ].forEach((over) => {
    const config = {
      ...apollian.sceneDefaults(),
      ...Object.fromEntries(
        Object.entries(RENDER_OPTIONS)
          .filter(([, spec]) => spec.section === 'svg')
          .map(([key, spec]) => [key, spec.default])
      ),
      ...options,
      ...over,
    };
    const slice = apollian.buildSlice(config, { aspect: 0.8, resolution: 160 });
    const svg = apollian.renderApollianSvg({
      config,
      height: 400,
      slice,
      stops: look.getPaletteStops(config.paletteName),
      width: 320,
    });
    const marks = (svg.match(/<(path|circle) /gu) ?? []).length;
    check(marks > 0, `the ${over.family} ${over.sliceMode} plot has no marks.`);
    if (over.family === 'classic') {
      check(
        svg.includes('<circle '),
        'the packing section plots no exact circles.'
      );
    }
  });
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(apollian|look|post)\.(\w+)/gu)]
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

const PARITY_CASES = {
  apollian4: { a4Shape: 'sheets', thickness: 0.01 },
  classic: { classicMaxSpheres: 1500 },
  disc: { fieldScale: 1.34, sliceElevation: 90, sliceOffset: 0.08 },
  kleinian: { fieldScale: 1.2, sliceOffset: 0.2, thickness: 0.003 },
};

// Every family's stage material per surface must compile to valid WGSL and
// light something; its slice view, drawn white-on-black, must carve the
// solid the CPU field does.
async function checkRender({ apollian, look }, THREE, TSL) {
  const size = PARITY_SIZE;
  const headless = await createHeadlessRenderer({ height: size, width: size });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const rig = look.createApollianRig();
  scene.add(rig.mesh);
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = TSL.pass(scene, camera);
  const { device } = renderer.backend;
  const draw = async () => {
    await headless.readFrame(() => pipeline.render());
    return headless.readFrame(() => pipeline.render());
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const family of FAMILIES) {
    const base = {
      ...apollian.sceneDefaults(),
      ...PARITY_CASES[family],
      family,
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const material of MATERIALS) {
      const config = { ...base, material };
      device.pushErrorScope('validation');
      rig.apply(config, {
        height: size,
        stops: look.getPaletteStops(config.paletteName),
        width: size,
      });
      const framing = apollian.frameView({
        layout: apollian.stageLayout(config),
        options: {
          fov: 30,
          height: size,
          margin: 0.1,
          projection: 'perspective',
          width: size,
        },
        view: 'hero',
      });
      camera.position.set(...framing.eye);
      camera.near = framing.near;
      camera.far = framing.far;
      camera.lookAt(...framing.target);
      camera.updateProjectionMatrix();
      // eslint-disable-next-line no-await-in-loop
      const frame = await draw();
      // eslint-disable-next-line no-await-in-loop
      const error = await device.popErrorScope();
      check(
        !error,
        `${family} ${material} fails validation: ${error?.message}`
      );
      let spread = 0;
      for (let i = 4; i < frame.data.length; i += 4) {
        const step =
          Math.abs(frame.data[i] - frame.data[i - 4]) +
          Math.abs(frame.data[i + 1] - frame.data[i - 3]) +
          Math.abs(frame.data[i + 2] - frame.data[i - 2]);
        spread += step > 6 ? 1 : 0;
      }
      check(spread > size * 4, `${family} ${material} draws a flat frame.`);
    }

    const flat = {
      ...base,
      sliceGlow: 0,
      sliceMode: 'section',
      slicePaper: '#000000',
      sliceShadow: 0,
    };
    rig.apply(flat, {
      height: size,
      stops: ['#ffffff', '#ffffff'],
      view: 'slice',
      width: size,
    });
    // eslint-disable-next-line no-await-in-loop
    const frame = await draw();
    const field = apollian.createField(flat, { withCut: false });
    const sliceFrame = apollian.sliceFrame(flat, 1);
    let agree = 0;
    let decided = 0;
    for (let j = 0; j < size; j += 1) {
      for (let i = 0; i < size; i += 1) {
        const x = ((i + 0.5) / size) * 2 - 1;
        const y = 1 - ((j + 0.5) / size) * 2;
        const s = field.distance(apollian.pointOn(sliceFrame, x, y));
        const lum = frame.data[(j * size + i) * 4];
        if (
          Math.abs(s) > sliceFrame.half * (4 / size) &&
          (lum < 40 || lum > 215)
        ) {
          decided += 1;
          if (s < 0 === lum > 215) agree += 1;
        }
      }
    }
    const share = decided > 0 ? agree / decided : 0;
    check(
      share >= PARITY_AGREEMENT,
      `${family}: the GPU slice agrees with the CPU field on only ${(share * 100).toFixed(1)}% of pixels.`
    );
  }
  rig.dispose();
  headless.dispose();
}

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkRolls(barrels);
  checkPacking(barrels);
  checkPlots(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE, TSL);

  if (failures.length > 0) {
    console.error(`apollian:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log('apollian:check — kernel, rig, scene, CLIs and workbench agree.');
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
