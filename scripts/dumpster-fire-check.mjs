#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the DumpsterFire pipeline: the kernel stays three-free,
// the authored generation is the scene as it was, rolls are deterministic,
// the CPU flame-noise mirror traces the blobs the shader draws, and the real
// stage mounts, burns and plots headlessly. See
// docs/dumpster-fire-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../src/modules/dumpsterFire/renderOptions.mjs';
import { createFireCapturer, loadKernel } from './lib/dumpsterFireRender.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'dumpsterFire');
const TOOL_DIR = path.join(REPO_ROOT, 'src/dev/tools/dumpsterFire');
const PLOT_KIT = '/src/modules/plotKit/index.js';
const ALLOWED_KERNEL_IMPORTS = new Set(['@modules/flora', '@modules/plotKit']);

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
            `kernel purity: ${name} imports "${specifier}" — stage code belongs in @modules/dumpsterFireRender.`
          )
        );
    })
  );
}

// Every default leaves the scene exactly as it was authored.
function checkAuthored({ fire }) {
  const config = fire.configDefaults();
  const trash = fire.layoutTrash(config);
  check(
    trash.fixed.length === 33 && trash.dynamic.length === 20,
    `the authored litter is ${trash.fixed.length} fixed + ${trash.dynamic.length} loose, not 33 + 20.`
  );
  const wall = fire.layoutWall(config);
  check(
    wall.length === 212 && wall.every((block) => !block.rubble),
    `the authored wall is ${wall.length} blocks, not the scene's 212 standing.`
  );
  const authoredPath = [
    [0, 0, 0],
    [0.4, 0.5, 0.05],
    [1.5, 1.5, 0],
    [4, 2.9, -0.05],
  ];
  check(
    JSON.stringify(fire.bendSmokePoints(authoredPath, config, 1.5)) ===
      JSON.stringify(authoredPath),
    'the default smoke curve no longer leaves the authored path alone.'
  );
}

function checkRolls({ fire }) {
  const a = fire.rollDumpsterConfig('check', {});
  const b = fire.rollDumpsterConfig('check', {});
  check(
    JSON.stringify(a) === JSON.stringify(b),
    'the same batch seed rolled two different generations.'
  );
  const kept = fire.rollDumpsterConfig('other', { base: a, keep: ['wall'] });
  check(
    fire.keysInFacet('wall').every((key) => kept[key] === a[key]),
    '--keep wall no longer holds the wall.'
  );
  const night = fire.rollDumpsterConfig('check', { pinned: { mood: 'night' } });
  check(
    night.sceneAmbientIntensity === 0,
    'a pinned night mood did not roll the night light.'
  );
  const systems = new Set();
  for (let i = 0; i < 40; i += 1) {
    const config = fire.rollDumpsterConfig(fire.seedFor('roll', i), {});
    systems.add(config.smokeSystem);
    const normalized = normalizeOptions('still', { ...config, png: true });
    check(normalized, `roll ${i} does not normalize.`);
    if (config.brickWallEnabled) {
      check(
        fire.layoutWall(config).some((block) => !block.rubble),
        `roll ${i} knocked the whole wall down.`
      );
    }
  }
  check(
    systems.size >= 3 && !systems.has('mixed'),
    `40 rolls drew ${[...systems].join(', ')} — want three or more systems, never plume + particles together.`
  );
}

// Fills the screen triangles of the CPU flame meshes into a coverage mask.
function rasterizeFlames(objects, project, width, height) {
  const mask = new Uint8Array(width * height);
  objects.forEach(({ meshes }) =>
    meshes.forEach(({ index, position }) => {
      const count = index ? index.length : position.length / 3;
      const at = (i) => {
        const v = index ? index[i] : i;
        return project(
          position[v * 3],
          position[v * 3 + 1],
          position[v * 3 + 2]
        );
      };
      const fill = (a, b, c) => {
        const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
        const x1 = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
        const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
        const y1 = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
        const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
        if (Math.abs(area) < 1e-9) return;
        for (let y = y0; y <= y1; y += 1) {
          for (let x = x0; x <= x1; x += 1) {
            const px = x + 0.5;
            const py = y + 0.5;
            const w0 =
              ((b.x - px) * (c.y - py) - (c.x - px) * (b.y - py)) / area;
            const w1 =
              ((c.x - px) * (a.y - py) - (a.x - px) * (c.y - py)) / area;
            if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) mask[y * width + x] = 1;
          }
        }
      };
      for (let t = 0; t + 2 < count; t += 3) {
        const corners = [at(t), at(t + 1), at(t + 2)];
        if (corners.every((p) => p.depth > 0)) fill(...corners);
      }
    })
  );
  return mask;
}

// The real stage, headless: it must load every model, burn, frame what
// burned and plot; and the flame blobs the CPU mirror traces must cover
// what the shader drew.
async function checkRender(kernel) {
  const { fire, look } = kernel;
  const width = 180;
  const height = 225;
  const options = {
    ...normalizeOptions('still', { png: true }),
    height,
    pixelRatio: 1,
    svg: true,
    width,
  };
  const capturer = await createFireCapturer(kernel, {
    height,
    pixelRatio: 1,
    width,
  });
  try {
    const config = {
      ...fire.configDefaults(),
      settle: 3,
      smokeSystem: 'mixed',
      trashLayout: 'rolled',
    };
    const { bounds } = await capturer.load(config, 'check');
    const view = fire.frameDumpster({ bounds, config, options, view: 'hero' });
    const image = await capturer.capture(view);
    let inked = 0;
    for (let i = 0; i < image.data.length; i += 4) {
      if (image.data[i] + image.data[i + 1] + image.data[i + 2] < 600) {
        inked += 1;
      }
    }
    check(
      inked > width * height * 0.08,
      'the headless stage drew next to nothing (R3F, the GLTF shim or a drei import failed).'
    );

    const svg = await capturer.svg(view, options);
    ['pen-0', 'pen-3', 'pen-5', 'pen-7', 'pen-9'].forEach((pen) =>
      check(
        svg.includes(`id="${pen}"`),
        `the default plot has no ${pen} layer.`
      )
    );

    const { effects, frame, solids } = capturer.parts;
    // The stage's own frame callbacks re-show meshes each frame, so the
    // check hides them through their materials, which nothing resets.
    const hidden = [];
    const hide = (object) => {
      const { material } = object;
      if (material?.visible) {
        hidden.push(material);
        material.visible = false;
      }
    };
    const lights = [];
    solids.traverse(hide);
    effects.traverse((object) => {
      if (object.isInstancedMesh) hide(object);
      if (object.isLight && object.visible) {
        lights.push(object);
        Object.assign(object, { visible: false });
      }
    });
    const withFlames = await frame(capturer.clock);
    const flames = look.readFlames(effects);
    effects.traverse((object) => {
      if (object.isMesh) hide(object);
    });
    const without = await frame(capturer.clock);
    hidden.forEach((material) => Object.assign(material, { visible: true }));
    lights.forEach((light) => Object.assign(light, { visible: true }));

    const { mask: drawn } = fire.smokeContrast(withFlames, without, 0.08);
    const { createProjector } = (await loadModules([PLOT_KIT]))[PLOT_KIT];
    const traced = rasterizeFlames(
      flames,
      createProjector(view, width, height),
      width,
      height
    );
    let both = 0;
    let either = 0;
    for (let i = 0; i < traced.length; i += 1) {
      if (traced[i] && drawn.covered[i]) both += 1;
      if (traced[i] || drawn.covered[i]) either += 1;
    }
    const iou = either ? both / either : 0;
    check(
      flames.length > 0 && iou > 0.75,
      `the CPU flame mirror covers the shader's blobs at IoU ${iou.toFixed(2)} (want > 0.75) — noise.js has drifted from FireAndSmokeGPU.`
    );
    console.log(
      `  flames: ${flames.length} blobs, mirror vs render IoU ${iou.toFixed(2)}`
    );
  } finally {
    capturer.dispose();
  }
}

async function main() {
  await checkKernelPurity();
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'DumpsterFireWorkbenchPage.jsx'),
    RENDER_OPTIONS,
    check
  );
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'LiveDumpster.jsx'),
    RENDER_OPTIONS,
    check
  );
  const kernel = await loadKernel();
  checkAuthored(kernel);
  checkRolls(kernel);
  await checkRender(kernel);

  if (failures.length > 0) {
    console.error(`dumpster-fire:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'dumpster-fire:check — kernel, authored scene, rolls, flame mirror, stage and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
