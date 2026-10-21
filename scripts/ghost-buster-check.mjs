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
  defaultsFor,
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
const RAIN = '/src/components/elements/WebGPU/rainCloud/rainCloudRig.js';
const DECAY = '/src/components/elements/WebGPU/cloth/clothDecay.js';
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@elements/WebGPU/cloth/clothDecay',
  '@elements/WebGPU/cloth/clothTopology',
  '@elements/WebGPU/ghost/ghostRig',
  '@elements/WebGPU/rainCloud/rainCloudRig',
  '@modules/flora',
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
  ['crosshatch', 'halftone', 'stipple', 'squiggle', 'scribble', 'tsp'].forEach(
    (shading) => {
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
      if (shading === 'tsp') {
        const tour =
          /id="pen-2"[^>]*><path d="([^"]*)"/u.exec(shaded)?.[1] ?? '';
        check(
          (tour.match(/M/gu) ?? []).length === 1,
          'tsp must be one unbroken line.'
        );
      }
    }
  );
  const ringed = ghost.renderGhostSvg({
    camera,
    coverage: { covered, height: 100, width: 100 },
    edges: false,
    height: 400,
    lattice,
    outline: { inside: false, mode: 'rings', stride: 3, thickness: 9 },
    pixelRatio: 0.25,
    style: 'none',
    width: 400,
  });
  const rings = (/id="pen-4"[^>]*><path d="([^"]*)"/u.exec(ringed)?.[1] ?? '')
    .split('M')
    .filter(Boolean).length;
  check(rings >= 3, "the outline layer no longer draws the skin's rings.");
  const textured = ghost.renderGhostSvg({
    camera,
    edges: false,
    height: 400,
    lattice,
    rims: { offset: 0, width: 0.01 },
    style: 'none',
    weave: { threads: 12 },
    width: 400,
  });
  check(/id="pen-5"/u.test(textured), 'the eye-rim layer draws nothing.');
  check(/id="pen-6"/u.test(textured), 'the weave layer draws nothing.');
  const gradient = {
    data: new Uint8Array(100 * 100 * 4),
    height: 100,
    width: 100,
  };
  for (let i = 0; i < 100 * 100; i += 1) {
    gradient.data.fill(Math.round(((i % 100) / 100) * 255), i * 4, i * 4 + 3);
  }
  const contoured = ghost.renderGhostSvg({
    camera,
    coverage: { covered, height: 100, width: 100 },
    edges: false,
    height: 400,
    image: gradient,
    lattice,
    pixelRatio: 0.25,
    style: 'none',
    texture: { levels: 4 },
    width: 400,
  });
  check(
    /id="pen-7"/u.test(contoured),
    'the texture-contour layer draws nothing over a gradient.'
  );
  const silhouette = /id="pen-1"[^>]*><path d="([^"]*)"/u.exec(outline)?.[1];
  check(
    (silhouette?.split('L').length ?? 0) > 12,
    'the silhouette no longer traces a closed outline.'
  );
  check(runs(plot(true)) > runs(plot(false)), 'the edge pass traces nothing.');
  return lattice;
}

// Zombie's rot and blood, Toxic's drips and Evil's brow: the maths cut and
// stain where they should, the skins wear them, and the plot draws them.
async function checkDecay({ ghost, look }) {
  const decay = (await loadModules([DECAY]))[DECAY];
  const zombie = look.resolveSkin('Zombie');
  const toxic = look.resolveSkin('Toxic');
  const evil = look.resolveSkin('Evil');
  check(
    zombie.holeRimWidth > 0 && zombie.bloodAmount > 0,
    'Zombie lost its rot and blood.'
  );
  check(toxic.dripAmount > 0, 'Toxic lost its hem drips.');
  check(evil.cutoutBrow > 0, "Evil's eyes lost their brow.");
  check(
    !(look.resolveSkin('Original').dripAmount > 0),
    'the base skin should carry no decay.'
  );

  const params = { ...decay.DECAY_DEFAULTS, ...toxic };
  const table = decay.dripTable(42);
  const band = params.dripAmount;
  const ring = (depth) => {
    let kept = 0;
    for (let a = 0; a < 720; a += 1) {
      const turn = (a / 720) * Math.PI * 2;
      const r = 0.5 - band + depth;
      kept +=
        decay.dripAt(
          0.5 + r * Math.cos(turn),
          0.5 + r * Math.sin(turn),
          0,
          params,
          table
        ).alpha > 0.5
          ? 1
          : 0;
    }
    return kept / 720;
  };
  check(ring(-0.01) === 1, 'the drips cut cloth above the hem band.');
  check(
    ring(band * 0.1) > 0.1 && ring(band * 0.1) < 0.6,
    'the hem band is no longer cut into drips.'
  );
  const eye = { radius: 0.06, u: 0.43, v: 0.4 };
  const innerTop = [0.43 + 0.03, 0.4 + 0.04];
  check(
    decay.eyeHoleDistance(...innerTop, eye, evil) > 0 &&
      decay.eyeHoleDistance(...innerTop, eye, decay.DECAY_DEFAULTS) < 0,
    "the brow no longer cuts the eye's inner top."
  );
  const zombieParams = { ...decay.DECAY_DEFAULTS, ...zombie };
  check(
    decay.decayAt(0.95, 5, 0.9, 1, zombieParams).rot === 1 &&
      decay.decayAt(0.2, 5, 0.9, 1, zombieParams).rot === 0,
    'the rot no longer hugs the holes.'
  );

  const { buildClothTopology } = (await loadModules([TOPOLOGY]))[TOPOLOGY];
  const topology = buildClothTopology({
    centered: true,
    height: 1,
    orientation: 'horizontal',
    segmentsX: 46,
    segmentsY: 46,
    shape: 'circle',
    width: 1,
  });
  const camera = ghost.frameGhost({
    bounds: { center: [0, 0, 0], radius: 0.55 },
    config: { cameraAzimuth: 0, cameraElevation: 85, cameraZoom: 1 },
    options: { fov: 30, height: 400, margin: 0.08, width: 400 },
    view: 'hero',
  });
  const plotOf = (skin) =>
    ghost.renderGhostSvg({
      camera,
      height: 400,
      lattice: ghost.ghostLattice({
        local: topology.posArr,
        matrixWorld: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        skin,
      }),
      style: 'none',
      width: 400,
    });
  check(
    plotOf(toxic).length > plotOf({ ...toxic, dripAmount: 0 }).length * 1.2,
    "the plot's edges no longer trace Toxic's drips."
  );
  check(
    / goo #/u.test(plotOf({ ...toxic, dripTint: 1 })) &&
      !/ goo #/u.test(plotOf(toxic)),
    'the goo layer should draw only when the goo is tinted or glows.'
  );
  const zombiePlot = plotOf(zombie);
  check(/ rot #/u.test(zombiePlot), 'the plot drew no rot layer.');
  check(/ blood #/u.test(zombiePlot), 'the plot drew no blood layer.');

  // The fill: one spiral split by region, each eye a stroke of its own.
  const { fill } = ghost.plotArgs(
    {
      plotWidthMm: 100,
      svgFill: 'spiral',
      svgFillInside: 'hole',
      svgFillShades: 1,
      svgFillShadow: 0.55,
      svgFillSpacing: 1,
      svgFillWiggle: 0.9,
      svgPenMm: 0.3,
      width: 400,
    },
    toxic
  );
  const toxicLattice = ghost.ghostLattice({
    local: topology.posArr,
    matrixWorld: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    skin: toxic,
  });
  const filled = ghost.renderGhostSvg({
    camera,
    fill,
    height: 400,
    lattice: toxicLattice,
    style: 'none',
    width: 400,
  });
  const fillLayer = (label) =>
    new RegExp(
      `label="pen-\\d+ ${label} (#[0-9a-f]{6})"[^>]*><path d="([^"]*)"`,
      'u'
    ).exec(filled);
  const cloth = fillLayer('cloth fill');
  check(
    cloth?.[1] === toxic.color,
    "the cloth fill is missing or not in the skin's colour."
  );
  check(fillLayer('goo fill'), "the fill drew no goo for Toxic's drips.");
  const eyes = (fillLayer('inside fill')?.[2].match(/M/gu) ?? []).length;
  const holes = toxicLattice.cutouts.length;
  check(
    holes > 0 && eyes >= holes && eyes <= holes * 2,
    `a hole fill should draw each eye in about one stroke, not ${eyes}.`
  );
}

// The storm's maths: rain stops on what is under it and splashes there, a
// forced strike peaks when asked, and the plot draws every storm layer.
async function checkStormKernel({ ghost, look }, lattice) {
  const rain = (await loadModules([RAIN]))[RAIN];
  check(look.hasStorm(look.resolveSkin('Sad')), 'the Sad skin has no storm.');
  check(
    !look.hasStorm(look.resolveSkin('Original')),
    'the Original skin should carry no storm.'
  );
  const params = {
    ...rain.RAIN_CLOUD_DEFAULTS,
    cloudVisible: true,
    lightningVisible: true,
    rainVisible: true,
  };
  const size = 8;
  const half = rain.shadowHalf(params);
  const heights = new Float32Array(size * size).fill(-0.9);
  for (let y = 2; y < 6; y += 1) heights.fill(0, y * size + 2, y * size + 6);
  const snapshot = {
    base: { x: 0, y: params.cloudHeight, z: 0 },
    floorVisible: true,
    floorY: -0.9,
    forcedAt: 2,
    params,
    seed: 7,
    shadow: { centerX: 0, centerZ: 0, half, heights, size },
    time: 2,
  };
  const { splashes, streaks } = rain.rainShapes(snapshot);
  check(streaks.length > params.rainCount * 0.2, 'the rain draws no streaks.');
  check(
    streaks.every(
      ([head]) =>
        head[1] >= rain.shadowHeight(snapshot.shadow, head[0], head[2])
    ),
    'a raindrop falls through what it should land on.'
  );
  check(
    splashes.some(({ center }) => Math.abs(center[1] - 0.002) < 1e-6),
    'no drop splashes on the surface under the cloud.'
  );
  const ramp = {
    ...snapshot.shadow,
    heights: Float32Array.from(
      { length: size * size },
      (_, i) => (i % size) * 0.01
    ),
  };
  const [nx, ny, nz] = rain.shadowNormal(ramp, 0, 0);
  const expected = Math.atan(0.01 / ((2 * half) / size));
  check(
    nx < 0 && Math.abs(nz) < 1e-6 && Math.abs(Math.acos(ny) - expected) < 1e-3,
    'splashes no longer tilt with the surface they land on.'
  );
  check(
    splashes.every(({ normal }) => Math.abs(Math.hypot(...normal) - 1) < 1e-6),
    'a splash has no surface normal.'
  );
  const strike = rain.strikeAt(2, params, 7, 2);
  check(
    strike && rain.strikeEnvelope(strike.age) > 0.95,
    'a forced strike does not peak at its second.'
  );
  check(
    rain.boltShapes(snapshot).length === 1 + params.lightningBranches,
    'the bolt lost its branches.'
  );
  const camera = ghost.frameGhost({
    bounds: { center: [0, 0, 0], radius: 1 },
    config: { cameraAzimuth: 0, cameraElevation: 5, cameraZoom: 1 },
    options: { fov: 30, height: 200, margin: 0.08, width: 200 },
    view: 'hero',
  });
  const svg = ghost.renderGhostSvg({
    camera,
    edges: false,
    folds: false,
    height: 200,
    lattice,
    lines: 4,
    storm: { cloud: null, snapshot },
    style: 'none',
    width: 200,
  });
  ['rain', 'splashes', 'lightning'].forEach((layer) =>
    check(svg.includes(` ${layer} #`), `the plot drew no ${layer} layer.`)
  );
}

// A storm skin headless: the rain shadow must be the cloth's top surface
// (no settled vertex above it, give or take a texel at the hem and eye
// holes) and the plot must draw the cloud.
async function checkStormRender(kernel) {
  const options = {
    ...defaultsFor('still'),
    height: 160,
    pixelRatio: 1,
    width: 128,
  };
  const capturer = await createGhostCapturer(kernel, options);
  try {
    const config = {
      ...kernel.ghost.sceneDefaults(),
      settle: 1,
      skin: 'Sad',
      strike: true,
    };
    const { bounds } = await capturer.load(config);
    const view = kernel.ghost.frameGhost({
      bounds,
      config,
      options,
      view: 'front',
    });
    await capturer.capture(view);
    const { lattice, storm } = await capturer.readback();
    check(storm?.shadow, 'the Sad skin mounted no rain cloud.');
    if (storm?.shadow) {
      const rain = (await loadModules([RAIN]))[RAIN];
      const { centerX, centerZ, half, size } = storm.shadow;
      const texel = (2 * half) / size;
      const nearest = (x, z) =>
        Math.max(
          ...[-1, 0, 1].flatMap((dx) =>
            [-1, 0, 1].map((dz) =>
              rain.shadowHeight(storm.shadow, x + dx * texel, z + dz * texel)
            )
          )
        );
      let inside = 0;
      let above = 0;
      for (let i = 0; i < lattice.shapeDist.length; i += 1) {
        const [x, y, z] = lattice.positions.subarray(i * 3, i * 3 + 3);
        if (
          lattice.shapeDist[i] >= 0 &&
          lattice.alpha[i] >= 0.5 &&
          Math.abs(x - centerX) < half * 0.95 &&
          Math.abs(z - centerZ) < half * 0.95
        ) {
          inside += 1;
          if (y > nearest(x, z) + 0.03) above += 1;
        }
      }
      check(inside > 50, 'the rain shadow covers none of the cloth.');
      check(
        above < inside * 0.01,
        `${above} of ${inside} cloth vertices rise above the rain shadow (flipped or stale height map).`
      );
    }
    const svg = await capturer.svg(view, options);
    ['cloud', 'rain', 'lightning'].forEach((layer) =>
      check(svg.includes(` ${layer} #`), `the Sad plot drew no ${layer} layer.`)
    );
  } finally {
    capturer.dispose();
  }
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
  const lattice = await checkPlot(kernel);
  await checkStormKernel(kernel, lattice);
  await checkDecay(kernel);
  await checkRender(kernel);
  await checkStormRender(kernel);

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
