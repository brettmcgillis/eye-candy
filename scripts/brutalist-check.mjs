#!/usr/bin/env node

/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax */
// Drift alarm for the Brutalist pipeline: both scenes, the CLIs and the
// workbench must agree with the kernel they share; every family must build
// and carve; the rig must compile and draw on both stages. See
// docs/brutalist-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  FAMILIES,
  LAYOUTS,
  MOTIFS,
  RENDER_OPTIONS,
  levaKeysFor,
  normalizeOptions,
} from '../src/modules/brutalist/renderOptions.mjs';
import { loadKernel } from './lib/brutalistRender.mjs';
import { createHeadlessRenderer } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'brutalist');
const PRESETS = {
  forest: '/src/components/scenes/WebGPU/Brutalist/presets/presets.js',
  maquette:
    '/src/components/scenes/WebGPU/BrutalistMaquette/presets/presets.js',
};
const HEADLESS = [
  'lib/brutalistRender.mjs',
  'brutalist-generate.mjs',
  'brutalist-video.mjs',
];
const BARRELS = {
  brutalist: '/src/modules/brutalist/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/brutalistRender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/brutalist/components/OptionSections.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set(['@modules/flora']);
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const MAX_PARTS = 2000;
const VARIANTS = { habitable: LAYOUTS, spomenik: MOTIFS };

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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/brutalistRender.`
          )
        );
    })
  );
}

function checkRigDefaults({ lights, look, post }) {
  const slot = (lighting, id) =>
    lights
      .buildSceneLightingRuntimeConfig({ lighting })
      .slots.find((entry) => entry.id === id);
  const sun = slot(look.FOREST_LIGHTING, 'sun');
  const sky = slot(look.FOREST_LIGHTING, 'sky');
  const key = slot(look.MAQUETTE_LIGHTING, 'key');
  const fill = slot(look.MAQUETTE_LIGHTING, 'fill');
  const { slots } = post.buildScenePostRuntimeConfig(look.BRUTALIST_POST);
  const postSlot = (id) => slots.find((entry) => entry.id === id);
  const expected = {
    lightFillGroundColor: fill?.groundColor,
    lightFillIntensity: fill?.intensity,
    lightFillSkyColor: fill?.skyColor,
    lightKeyColor: key?.color,
    lightKeyIntensity: key?.intensity,
    lightSkyGroundColor: sky?.groundColor,
    lightSkyIntensity: sky?.intensity,
    lightSkySkyColor: sky?.skyColor,
    lightSunAzimuth: sun?.spherical?.azimuth,
    lightSunColor: sun?.color,
    lightSunElevation: sun?.spherical?.elevation,
    lightSunIntensity: sun?.intensity,
    postGradeEnabled: postSlot('grade')?.enabled,
    postGrainEnabled: postSlot('grain')?.enabled,
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
function checkPresets(stage, { PRESETS: presets }) {
  const allowed = new Set(
    Object.keys(RENDER_OPTIONS).filter(
      (key) =>
        RENDER_OPTIONS[key].scene && RENDER_OPTIONS[key].stages.includes(stage)
    )
  );
  const leva = levaKeysFor(stage);
  Object.entries(presets).forEach(([name, preset]) => {
    const label = `${stage} preset "${name}"`;
    Object.keys(preset)
      .filter((key) => !allowed.has(key) && !CAMERA_KEY.test(key))
      .forEach((key) =>
        failures.push(`${label} sets "${key}", which its scene does not show.`)
      );
    leva
      .filter((key) => !(key in preset))
      .forEach((key) => failures.push(`${label} leaves out "${key}".`));
    Object.entries(preset).forEach(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      if (spec?.type === 'number') {
        check(
          value >= spec.min && value <= spec.max,
          `${label} sets ${key} = ${value}, outside [${spec.min}, ${spec.max}] — Leva would clamp it.`
        );
      }
      if (spec?.type === 'enum') {
        check(
          spec.choices.includes(value),
          `${label} sets ${key} = "${value}", not one of its choices.`
        );
      }
    });
  });
}

const finite = (values) => values.every((v) => Number.isFinite(v));

function checkStructure(label, brutalist, config) {
  const structure = brutalist.buildStructure(config);
  check(structure.parts.length > 0, `${label} builds no parts.`);
  check(
    structure.parts.length <= MAX_PARTS,
    `${label} builds ${structure.parts.length} parts, over ${MAX_PARTS}.`
  );
  structure.parts.forEach((part) =>
    check(
      finite([...part.center, ...part.half]),
      `${label} has a non-finite part (${part.role} #${part.id}).`
    )
  );
  const height = structure.bounds.max[1];
  check(
    height > config.structureHeight * 0.4 &&
      height < config.structureHeight * 1.6,
    `${label} stands ${height.toFixed(1)}m tall for a ${config.structureHeight}m structure.`
  );
  return structure;
}

// Every family, layout and motif builds; every roll is a valid config;
// holding a facet holds it; the same seed builds the same structure.
function checkKernel({ brutalist }) {
  const base = brutalist.sceneDefaults();
  FAMILIES.forEach((family) =>
    (VARIANTS[family] ?? [null]).forEach((variant) => {
      const config = {
        ...base,
        family,
        layout: family === 'habitable' ? variant : base.layout,
        motif: family === 'spomenik' ? variant : base.motif,
      };
      checkStructure(
        `${family}${variant ? `/${variant}` : ''}`,
        brutalist,
        config
      );
    })
  );

  for (let i = 0; i < 30; i += 1) {
    const config = brutalist.rollBrutalistConfig(`check-${i}`);
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    const structure = checkStructure(`roll check-${i}`, brutalist, config);
    const site = brutalist.scatterTrees(config, structure);
    check(
      site.trees.every((tree) => finite([tree.x, tree.y, tree.z, tree.scale])),
      `roll check-${i} scatters a non-finite tree.`
    );
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }

  const source = brutalist.rollBrutalistConfig('b');
  const held = brutalist.rollBrutalistConfig('a', {
    base: source,
    keep: ['form'],
  });
  brutalist
    .keysInFacet('form')
    .forEach((key) =>
      check(held[key] === source[key], `holding form still re-rolled "${key}".`)
    );
  const twice = [0, 1].map(() =>
    JSON.stringify(brutalist.buildStructure(source).parts)
  );
  check(
    twice[0] === twice[1],
    'the same config built two different structures.'
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [
        ...source.matchAll(
          /\b(?:kernel\.)?(brutalist|look|lights|post)\.(\w+)/gu
        ),
      ]
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
  const source = await readFile(PAGE_FIELDS, 'utf8').catch(() => null);
  check(source, 'the workbench lost OptionSections.jsx.');
  const block = source?.match(/const HANDLED = new Set\(\[([^\]]*)\]/u)?.[1];
  check(block != null, 'OptionSections.jsx lost its HANDLED list.');
  [...(block ?? '').matchAll(/'(\w+)'/gu)].forEach(([, key]) =>
    check(
      key in RENDER_OPTIONS,
      `the workbench hand-lays "${key}", which is not in renderOptions.mjs.`
    )
  );
}

// The rig must carve, compile to valid WGSL and draw something on both
// stages.
async function checkRender(kernel) {
  const { THREE, Tree, brutalist, look } = kernel;
  const size = 128;
  for (const stage of ['forest', 'maquette']) {
    const headless = await createHeadlessRenderer({
      height: size,
      width: size,
    });
    const { renderer } = headless;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    const rig = look.createBrutalistRig({ Tree, stage });
    scene.add(rig.group);
    rig.attach(scene);
    const config = brutalist.sceneDefaults();
    const structure = brutalist.buildStructure(config);
    rig.apply(config);
    rig.setStructure(structure, config);
    rig.setSite(brutalist.scatterTrees(config, structure), config);
    scene.add(new THREE.HemisphereLight('#ffffff', '#333333', 2));
    const view = brutalist.frameView({
      options: { fov: 30, height: size, margin: 0.1, width: size },
      stage,
      structure,
      transform: rig.transform,
      view: 'hero',
    });
    const camera = new THREE.PerspectiveCamera(
      view.fov,
      1,
      view.near,
      view.far
    );
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    const { device } = renderer.backend;
    device.pushErrorScope('validation');
    await headless.readFrame(() => renderer.render(scene, camera));
    const frame = await headless.readFrame(() =>
      renderer.render(scene, camera)
    );
    const error = await device.popErrorScope();
    check(!error, `the ${stage} rig fails validation: ${error?.message}`);
    let lit = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 12) lit += 1;
    }
    check(lit > size * size * 0.2, `the ${stage} stage draws almost nothing.`);
    rig.detach(scene);
    rig.dispose();
    headless.dispose();
  }
}

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  const kernel = await loadKernel();
  const loaded = await loadModules(Object.values(PRESETS));
  const barrels = {
    brutalist: kernel.brutalist,
    lights: kernel.lights,
    look: kernel.look,
    post: kernel.post,
  };
  checkRigDefaults(barrels);
  Object.entries(PRESETS).forEach(([stage, entry]) =>
    checkPresets(stage, loaded[entry])
  );
  checkKernel(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(kernel);

  if (failures.length > 0) {
    console.error(`brutalist:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'brutalist:check — kernel, rig, scenes, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
