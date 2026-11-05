#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Rabbit pipeline (docs/rabbit-pipeline.md): the scene
// and the bench must draw the same subject, the kernel must stay three-free,
// rolls must be reproducible volleys, the Painting preset must keep the
// reference's four arrows, the grass mirror must land on the rendered
// blades, and the real stage must mount, draw and plot headlessly.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../src/modules/rabbit/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import {
  createRabbitCapturer,
  loadKernel,
  rabbitAt,
  rollArgs,
} from './lib/rabbitRender.mjs';
import schemaControlCoverage from './lib/schemaControlCoverage.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const SCENE_DIR = 'src/components/scenes/WebGPU/StayHunted';
const CONTROLS = [`/${SCENE_DIR}/utils/controls.js`];
const PRESETS = `/${SCENE_DIR}/presets/presets.js`;
const KERNEL_DIR = path.join(REPO_ROOT, 'src/modules/rabbit');
const TOOL_DIR = path.join(REPO_ROOT, 'src/dev/tools/rabbit');
const PLOT_KIT = '/src/modules/plotKit/index.js';
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@modules/materialxNoise',
  '@modules/plotKit',
]);

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
            `kernel purity: ${name} imports "${specifier}" — stage code belongs in @modules/rabbitRender.`
          )
        );
    })
  );
}

// The scene and the workbench draw the same subject.
async function checkScene() {
  const source = await readFile(
    path.join(REPO_ROOT, SCENE_DIR, 'StayHunted.jsx'),
    'utf8'
  );
  check(
    source.includes('<HuntedSubject'),
    'StayHunted no longer draws @modules/rabbitRender HuntedSubject — RabbitCLI would render a different rabbit.'
  );
  const { PRESETS: presets } = (await loadModules([PRESETS]))[PRESETS];
  check(
    presets.Painting?.volley === 'painting',
    'the Painting preset no longer holds the painting volley.'
  );
}

function checkRolls(kernel) {
  const { rabbit } = kernel;
  check(
    rabbit.layoutVolley({ volley: 'painting' }) === rabbit.PAINTING_VOLLEY &&
      rabbit.PAINTING_VOLLEY.length === 4,
    "the painting volley is no longer the reference's four arrows."
  );
  const roll = rollArgs(kernel, { options: { keep: '' }, typed: new Set() });
  const volleys = new Set();
  for (let i = 0; i < 36; i += 1) {
    const { config } = rabbitAt(kernel, { batch: 'check', index: i, roll });
    volleys.add(config.volley);
    rabbit.CONFIG_KEYS.forEach((key) =>
      check(config[key] !== undefined, `roll check-${i} leaves out "${key}".`)
    );
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
    const volley = rabbit.layoutVolley(config);
    if (config.volley === 'rolled') {
      check(
        volley.length === config.arrowCount,
        `roll check-${i} lays out ${volley.length} arrows, not ${config.arrowCount}.`
      );
    }
    check(
      volley.filter((arrow) => arrow.ribbon).length === 1,
      `roll check-${i} ties the ribbon to ${volley.filter((a) => a.ribbon).length} arrows.`
    );
    check(
      config.poseTime >= 0 && config.poseTime <= rabbit.CLIP_SECONDS,
      `roll check-${i} poses outside the clip.`
    );
  }
  check(volleys.size === 2, 'the volley roll never lands on one of its kinds.');
  const first = rabbitAt(kernel, { batch: 'check', index: 3, roll }).config;
  check(
    JSON.stringify(rabbit.layoutVolley(first)) ===
      JSON.stringify(rabbit.layoutVolley({ ...first })),
    'a config must lay out the same volley every time.'
  );
}

const MIRROR_BLADES = 60;
const GREEN = (data, i) =>
  data[i + 1] > data[i] + 4 && data[i + 1] > data[i + 2] + 8;

// Close on a few blades with everything else hidden: the mirrored spine of
// every blade card that faces the camera (an edge-on card draws no pixels)
// must run along a rendered blade, and the same spines moved 1 cm must not.
async function checkGrassMirror(kernel, capturer, options) {
  const { look, rabbit } = kernel;
  const { height, width } = options;
  const { handles } = capturer;
  const { geometry } = handles.grass.mesh;
  const placed = geometry.instanceCount;
  geometry.instanceCount = Math.min(placed, MIRROR_BLADES);
  const hidden = [
    handles.model.scene,
    ...handles.arrows,
    ...(handles.ribbon ?? []),
  ].filter(Boolean);
  const { grass } = look.readSubject(handles, capturer.clock);
  const spines = rabbit.grassBlades(grass);
  const close = rabbit.frameRabbit({
    bounds: { points: spines.flat() },
    config: { viewAzimuth: 30, viewElevation: 25 },
    options: { ...options, margin: 0.02 },
    view: 'hero',
  });
  hidden.forEach((object) => {
    // eslint-disable-next-line no-param-reassign
    object.visible = false;
  });
  const shot = await capturer.capture(close);
  hidden.forEach((object) => {
    // eslint-disable-next-line no-param-reassign
    object.visible = true;
  });
  geometry.instanceCount = placed;

  const view = [close.target[0] - close.eye[0], close.target[2] - close.eye[2]];
  const across = Math.hypot(...view);
  const facing = [];
  for (let i = 0; i < grass.count; i += 1) {
    if (grass.data[i * 4 + 1] * grass.uniforms.bladeHeight > 0) {
      const yaw = grass.data[i * 4];
      facing.push(
        Math.abs(Math.sin(yaw) * view[0] + Math.cos(yaw) * view[1]) / across
      );
    }
  }
  const { createProjector } = (await loadModules([PLOT_KIT]))[PLOT_KIT];
  const project = createProjector(close, width, height);
  const share = (shift) => {
    let samples = 0;
    let onBlade = 0;
    spines.forEach((spine, b) => {
      if (facing[b] < 0.6) return;
      spine.slice(1, 4).forEach((point) => {
        const p = project(point[0] + shift, point[1], point[2] - shift);
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) return;
        samples += 1;
        let hit = false;
        for (let dy = -1; dy <= 1 && !hit; dy += 1) {
          for (let dx = -1; dx <= 1 && !hit; dx += 1) {
            hit = GREEN(shot.data, ((y + dy) * width + x + dx) * 4);
          }
        }
        if (hit) onBlade += 1;
      });
    });
    return { samples, value: onBlade / Math.max(samples, 1) };
  };
  const matched = share(0);
  const shifted = share(0.007);
  const label = `wind ${grass.uniforms.windStrength}, t=${grass.time.toFixed(2)}s`;
  check(
    matched.samples > 40 && matched.value > 0.9,
    `only ${(100 * matched.value).toFixed(0)}% of the grass mirror's spine samples land on rendered blades (${label}) — @modules/rabbit grass.js has drifted from @elements/Grass straightBlade.`
  );
  check(
    shifted.value < 0.6,
    `the grass mirror test no longer tells a match from a 1 cm miss (${(100 * shifted.value).toFixed(0)}%).`
  );
  console.log(
    `  grass mirror (${label}): ${(100 * matched.value).toFixed(0)}% of ${matched.samples} samples on blades, ${(100 * shifted.value).toFixed(0)}% when moved 1 cm`
  );
}

// The real stage, headless: the painting must mount with all four arrows
// struck, draw, plot every pen, and the grass mirror must sit on the
// rendered blades while the wind blows them.
async function checkRender(kernel) {
  const { rabbit } = kernel;
  const width = 200;
  const height = 250;
  const options = {
    ...normalizeOptions('still'),
    height,
    pixelRatio: 1,
    svg: true,
    width,
  };
  const capturer = await createRabbitCapturer(kernel, {
    height,
    pixelRatio: 1,
    width,
  });
  try {
    const config = { ...rabbit.configDefaults(), settle: 1 };
    const { bounds } = await capturer.load(config);
    check(
      capturer.handles.arrows.length === 4,
      `the painting strikes ${capturer.handles.arrows.length} arrows, not 4.`
    );
    check(
      Math.abs(
        capturer.handles.model.animations[0].duration - rabbit.CLIP_SECONDS
      ) < 0.1,
      `CLIP_SECONDS (${rabbit.CLIP_SECONDS}) no longer matches the clip (${capturer.handles.model.animations[0].duration.toFixed(2)}s).`
    );
    const density =
      capturer.handles.rabbit.geometry.getAttribute('furDensity')?.array ?? [];
    const bald = density.filter((value) => value === 0).length;
    check(
      bald > 200 && bald < density.length * 0.2,
      `the fur mask leaves ${bald} of ${density.length} vertices bald — it should be the eyes and teeth (a few hundred).`
    );
    const eyes = (
      capturer.handles.rabbit.geometry.getAttribute('eyeMask')?.array ?? []
    ).filter((value) => value === 1).length;
    check(
      eyes > 100 && eyes < bald,
      `the eye mask covers ${eyes} vertices — it should be both eyes' pieces (a few hundred), not the teeth.`
    );
    const view = rabbit.frameRabbit({ bounds, config, options, view: 'hero' });
    const frame = await capturer.capture(view);
    let ink = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] < 450) ink += 1;
    }
    check(
      ink > width * height * 0.03,
      'the headless stage drew no rabbit (R3F, the GLTF shim or the lights failed).'
    );
    const svg = await capturer.svg(view, options);
    [
      [0, 'slices'],
      [1, 'silhouette'],
      [3, 'contours'],
      [6, 'fur'],
      [7, 'arrows'],
      [8, 'ribbon'],
      [9, 'grass'],
      [10, 'eyes'],
    ].forEach(([pen, label]) =>
      check(
        new RegExp(`id="pen-${pen}"`, 'u').test(svg),
        `the plot draws no ${label}.`
      )
    );
    check(
      !/id="pen-\d"/u.test(
        rabbit.renderRabbitSvg({
          ...rabbit.plotArgs({ ...options, svgSilhouette: false }, config),
          camera: view,
          subject: kernel.look.readSubject(capturer.handles, capturer.clock),
          visible: () => false,
        })
      ),
      'hidden-line removal no longer hides anything.'
    );

    await checkGrassMirror(kernel, capturer, options);
    await capturer.load({ ...config, grassWind: 1.2, settle: 2.6 });
    await checkGrassMirror(kernel, capturer, options);
  } finally {
    capturer.dispose();
  }
}

async function main() {
  await checkKernelPurity();
  await checkScene();
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'RabbitWorkbenchPage.jsx'),
    RENDER_OPTIONS,
    check
  );
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'LiveRabbit.jsx'),
    RENDER_OPTIONS,
    check
  );
  const kernel = await loadKernel();
  checkRolls(kernel);
  await checkRender(kernel);
  failures.push(...(await schemaControlCoverage(CONTROLS)));

  if (failures.length > 0) {
    console.error(`rabbit:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'rabbit:check — kernel, scene, rolls, grass mirror, stage and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
