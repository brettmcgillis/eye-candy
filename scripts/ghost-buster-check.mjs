#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the GhostBuster pipeline: the skins library, the kernel,
// the CLIs and the workbench must agree, the plot must cut the cloth where
// the shader does, and the real stage must mount and draw headlessly — the
// last is what breaks if R3F ever loads as Node's CommonJS copy again or the
// texture loader stops resolving public/. See docs/ghost-buster-pipeline.md.
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/ghostBuster/renderOptions.mjs';
import {
  createGhostCapturer,
  ghostAt,
  loadKernel,
  rollArgs,
} from './lib/ghostBusterRender.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'ghostBuster');
const PAGE = path.join(
  REPO_ROOT,
  'src/dev/tools/ghostBuster/GhostBusterWorkbenchPage.jsx'
);
const TOPOLOGY = '/src/components/elements/WebGPU/cloth/clothTopology.js';
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@elements/WebGPU/cloth/clothTopology',
  '@elements/WebGPU/ghost/ghostRig',
  '@modules/flora',
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
            `kernel purity: ${name} imports "${specifier}" — stage code belongs in @modules/ghostBusterRender.`
          )
        );
    })
  );
}

// Every skin lays over the base cleanly and its textures exist, so a skin
// added in GhostBuster renders everywhere without edits here.
async function checkSkins({ look }) {
  const base = look.resolveSkin(look.SKIN_NAMES[0]);
  check(look.SKIN_NAMES.includes('Linen'), 'the Linen skin is missing.');
  check(
    look.resolveSkin('Linen').fabricAmount > 0,
    'Linen must wear the weave (fabricAmount > 0).'
  );
  await Promise.all(
    look.SKIN_NAMES.map(async (name) => {
      const skin = look.resolveSkin(name);
      Object.keys(base).forEach((key) =>
        check(skin[key] !== undefined, `skin "${name}" resolves no "${key}".`)
      );
      const props = look.ghostProps(skin);
      check(
        props.segmentsX > 0 && props.segmentsY > 0,
        `skin "${name}" has no cloth segments.`
      );
      await Promise.all(
        [skin.outerTextureUrl, skin.innerTextureUrl]
          .filter(Boolean)
          .map((url) =>
            access(path.join(REPO_ROOT, 'public', url)).catch(() =>
              failures.push(`skin "${name}" names a missing texture ${url}.`)
            )
          )
      );
    })
  );
}

function checkRolls(kernel) {
  const { ghost, look } = kernel;
  const roll = rollArgs(kernel, {
    options: { keep: '', skins: null },
    typed: new Set(),
  });
  const skins = new Set();
  for (let i = 0; i < 24; i += 1) {
    const { config } = ghostAt(kernel, { batch: 'check', index: i, roll });
    skins.add(config.skin);
    SCENE_KEYS.forEach((key) =>
      check(config[key] !== undefined, `roll check-${i} leaves out "${key}".`)
    );
    try {
      normalizeOptions('still', { ...config, png: true });
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }
  check(skins.size > 3, 'the skin roll keeps landing on the same skins.');
  const again = ghost.rollGhostConfig('check', roll);
  check(
    JSON.stringify(again) ===
      JSON.stringify(
        ghostAt(kernel, { batch: 'check', index: 0, roll }).config
      ),
    'a batch seed must roll the same generation every time.'
  );
  check(
    look.SKIN_NAMES.every((name) => typeof name === 'string'),
    'skin names must be strings.'
  );
}

// The plot on an undraped cloth seen from above: rings must be cut by the
// eye holes and the hem, which the edge pass then traces.
async function checkPlot({ ghost }) {
  const { buildClothTopology } = (await loadModules([TOPOLOGY]))[TOPOLOGY];
  const topology = buildClothTopology({
    centered: true,
    height: 1,
    orientation: 'horizontal',
    segmentsX: 40,
    segmentsY: 40,
    shape: 'circle',
    width: 1,
  });
  const lattice = ghost.ghostLattice({
    local: topology.posArr,
    matrixWorld: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    skin: { alphaScale: 4, alphaSeed: 42, clothSegments: 40, edgeFade: 0.15 },
  });
  const options = { fov: 30, height: 400, margin: 0.08, width: 400 };
  const camera = ghost.frameGhost({
    bounds: ghost.latticeBounds(lattice),
    config: { cameraAzimuth: 0, cameraElevation: 85, cameraZoom: 1 },
    options,
    view: 'hero',
  });
  const plot = (edges) =>
    ghost.renderGhostSvg({ camera, edges, height: 400, lattice, width: 400 });
  const runs = (svg) => (svg.match(/M/gu) ?? []).length;
  check(runs(plot(false)) > 40, 'the eye holes no longer cut the rings.');
  const covered = new Uint8Array(100 * 100);
  for (let i = 0; i < covered.length; i += 1) {
    covered[i] = Math.hypot((i % 100) - 50, Math.floor(i / 100) - 50) < 30;
  }
  const outline = ghost.renderGhostSvg({
    camera,
    edges: false,
    height: 400,
    lattice,
    pixelRatio: 0.25,
    coverage: { covered, height: 100, width: 100 },
    silhouette: true,
    style: 'none',
    width: 400,
  });
  const image = {
    data: new Uint8Array(400 * 400 * 4),
    height: 400,
    width: 400,
  };
  for (let i = 0; i < 400 * 400; i += 1) {
    image.data.fill(Math.round(((i % 400) / 400) * 255), i * 4, i * 4 + 3);
  }
  ['crosshatch', 'halftone', 'stipple'].forEach((shading) => {
    const shaded = ghost.renderGhostSvg({
      camera,
      edges: false,
      height: 400,
      image,
      lattice,
      shade: { angle: 45, gamma: 1, shading, spacing: 6 },
      style: 'none',
      width: 400,
    });
    check(
      /id="pen-2"[^>]*><path d="M/u.test(shaded),
      `the ${shading} shading draws nothing over a gradient.`
    );
  });
  const silhouette = /id="pen-1"[^>]*><path d="([^"]*)"/u.exec(outline)?.[1];
  check(
    (silhouette?.split('L').length ?? 0) > 12,
    'the silhouette no longer traces a closed outline.'
  );
  check(runs(plot(true)) > runs(plot(false)), 'the edge pass traces nothing.');
}

// The real stage, headless: a textured skin must mount, settle and draw.
async function checkRender(kernel) {
  const capturer = await createGhostCapturer(kernel, {
    height: 120,
    pixelRatio: 1,
    width: 96,
  });
  try {
    const config = {
      ...kernel.ghost.sceneDefaults(),
      backgroundColor: '#000000',
      skin: 'Nebula',
      settle: 0.5,
    };
    const { bounds } = await capturer.load(config);
    check(bounds && bounds.radius > 0.1, 'the settled ghost has no extent.');
    const frame = await capturer.capture(
      kernel.ghost.frameGhost({
        bounds,
        config,
        options: { fov: 30, height: 120, margin: 0.08, width: 96 },
        view: 'front',
      })
    );
    let lit = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i] + frame.data[i + 1] + frame.data[i + 2] > 60) lit += 1;
    }
    check(
      lit > 96 * 120 * 0.05,
      'the headless stage drew no ghost (R3F, textures or the studio failed).'
    );
  } finally {
    capturer.dispose();
  }
}

async function main() {
  await checkKernelPurity();
  await checkWorkbenchPage(PAGE, RENDER_OPTIONS, check);
  const kernel = await loadKernel();
  await checkSkins(kernel);
  checkRolls(kernel);
  await checkPlot(kernel);
  await checkRender(kernel);

  if (failures.length > 0) {
    console.error(`ghost-buster:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'ghost-buster:check — skins, kernel, plot, stage and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
