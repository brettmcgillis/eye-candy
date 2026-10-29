#!/usr/bin/env node

/* eslint-disable no-console */
// Holds CandleCLI and the Burning At Both Ends scene together
// (docs/candle-pipeline.md): the kernel stays three-free, every scene preset
// is a valid generation, rolls repeat, the wax mesh is closed and faces out,
// the flame signal is pure, the workbench names real options — and, with
// --render, a lit and an extinguished candle render a non-flat frame and a
// plot with wax line work, isotherms and smoke.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { RENDER_OPTIONS } from '../src/modules/candle/renderOptions.mjs';
import {
  candleAt,
  createCandleCapturer,
  loadKernel,
} from './lib/candleRender.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import schemaControlCoverage from './lib/schemaControlCoverage.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL = '/src/modules/candle/index.js';
const KERNEL_DIR = path.join(REPO_ROOT, 'src/modules/candle');
const TOOL_DIR = path.join(REPO_ROOT, 'src/dev/tools/candle');
const SCENE_DIR = '/src/components/scenes/WebGPU/BurningAtBothEnds';
const PRESETS = `${SCENE_DIR}/presets/presets.js`;
const CONTROLS = `${SCENE_DIR}/utils/controls.js`;
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@modules/plotKit',
  '@utils/paletteStops',
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
            `kernel purity: ${name} imports "${specifier}" — stage code belongs in @modules/candleRender.`
          )
        );
    })
  );
}

async function checkPresets(candle) {
  const loaded = await loadModules([PRESETS]);
  const { PRESETS: presets } = loaded[PRESETS];
  failures.push(...(await schemaControlCoverage([CONTROLS])));
  const known = new Set([...candle.SCENE_KEYS, 'cameraMode']);
  Object.entries(presets).forEach(([name, preset]) => {
    Object.entries(preset).forEach(([key, value]) => {
      if (key.startsWith('camera') && key !== 'cameraMode') return;
      check(known.has(key), `preset ${name}: "${key}" is not a scene key.`);
      const spec = RENDER_OPTIONS[key];
      if (spec?.type === 'number') {
        check(
          value >= spec.min && value <= spec.max,
          `preset ${name}: ${key} ${value} is outside [${spec.min}, ${spec.max}] — Leva would clamp it.`
        );
      }
      if (spec?.choices) {
        check(
          spec.choices.includes(value),
          `preset ${name}: ${key} "${value}" is not a choice.`
        );
      }
    });
  });
}

function checkRolls(candle) {
  const roll = { base: {}, keep: [], pinned: {} };
  const a = candle.rollCandleConfig('check', roll);
  const b = candle.rollCandleConfig('check', roll);
  check(JSON.stringify(a) === JSON.stringify(b), 'a roll does not repeat.');
  const seen = new Set();
  for (let i = 0; i < 24; i += 1) {
    const config = candle.rollCandleConfig(`check-${i}`, roll);
    seen.add(`${config.flame}:${config.smoke}`);
    Object.entries(config).forEach(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      if (spec?.type === 'number' && spec.roll) {
        check(
          value >= spec.min && value <= spec.max,
          `roll check-${i}: ${key} ${value} is out of range.`
        );
      }
    });
  }
  check(seen.size >= 3, 'rolls barely vary the flame and smoke systems.');
  const held = candle.rollCandleConfig('other', {
    ...roll,
    base: a,
    keep: ['candle'],
  });
  candle
    .keysInFacet('candle')
    .forEach((key) =>
      check(held[key] === a[key], `keep candle still rolled ${key}.`)
    );
}

function checkWax(candle) {
  ['pillar', 'twisted', 'faceted'].forEach((profile) => {
    const config = { ...candle.sceneDefaults(), profile, waxDetail: 14 };
    const wax = candle.buildWax(candle.candleForm(config));
    const count = wax.position.length / 3;
    check(count > 1000, `${profile}: the wax mesh is nearly empty (${count}).`);
    let out = 0;
    let total = 0;
    for (let v = 0; v < count; v += 1) {
      const x = wax.position[v * 3];
      const y = wax.position[v * 3 + 1];
      const z = wax.position[v * 3 + 2];
      if (Math.abs(y) < config.candleHeight * 0.3) {
        total += 1;
        if (wax.normal[v * 3] * x + wax.normal[v * 3 + 2] * z > 0) out += 1;
      }
    }
    check(out / total > 0.99, `${profile}: wax normals do not face out.`);
    check(
      wax.glow.some((g) => g > 0.2),
      `${profile}: no flame light reaches the wax glow bake.`
    );
  });
}

function checkSignal(candle) {
  const config = { ...candle.sceneDefaults(), flameState: 'gutter' };
  const a = candle.flameSignal(config, 3.21);
  const b = candle.flameSignal(config, 3.21);
  check(
    JSON.stringify(a) === JSON.stringify(b),
    'the flame signal is not pure.'
  );
  check(a.emit > 0 && a.emit <= 1.2, 'the flame signal emits out of range.');
}

const flat = ({ data }) => {
  let lo = 255;
  let hi = 0;
  for (let i = 0; i < data.length; i += 4) {
    lo = Math.min(lo, data[i]);
    hi = Math.max(hi, data[i]);
  }
  return hi - lo < 8;
};

// From the hero camera (above), the candle's own body stands between the
// camera and the bottom flame: the flame may add no light over any pixel the
// candle covers, beyond a thin antialiased edge.
async function checkBottomFlameHidden(
  kernel,
  capturer,
  bounds,
  options,
  label
) {
  const view = kernel.candle.frameCandle({ bounds, options, view: 'hero' });
  const { frame, stage } = capturer.parts;
  const depth = await capturer.candleDepth(view);
  await capturer.capture(view);
  const lit = await frame(capturer.clock);
  const bottom = [];
  stage.scene.traverse((object) => {
    if (object.userData.effect === 'flame' && Math.abs(object.rotation.z) > 3) {
      bottom.push(object);
    }
  });
  bottom.forEach((object) => Object.assign(object, { visible: false }));
  const dark = await frame(capturer.clock);
  bottom.forEach((object) => Object.assign(object, { visible: true }));
  const glow = kernel.look.effectGlow(lit, dark);
  const { covered, height, width } = depth;
  const inside = (x, y) => {
    for (let dy = -3; dy <= 3; dy += 1) {
      for (let dx = -3; dx <= 3; dx += 1) {
        const sx = Math.min(width - 1, Math.max(0, x + dx));
        const sy = Math.min(height - 1, Math.max(0, y + dy));
        if (!covered[sy * width + sx]) return false;
      }
    }
    return true;
  };
  let leaks = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (glow.data[y * width + x] > 0.025 && inside(x, y)) leaks += 1;
    }
  }
  check(
    leaks <= 1,
    `${label}: the bottom flame draws over the candle in ${leaks} px (depth-incorrect).`
  );
}

// curlNoise returns 0 outside a window of its input, so a drift that walked
// out of it left the plume a straight line after about a minute. A plume
// burned far into the clock must stand as tall as one at the start.
async function plumeHeight(capturer) {
  const { effects } = capturer.parts;
  const dots = await effects.smoke.read();
  const base = effects.smoke.uniforms.emitterTop.value.y;
  return dots.reduce((top, [, y]) => Math.max(top, y), -Infinity) - base;
}

async function checkSmokeAtLateClock(capturer, label) {
  const { uniforms } = capturer.parts.effects.smoke;
  await capturer.burn(12);
  const early = await plumeHeight(capturer);
  uniforms.time.value = 3600;
  await capturer.burn(12);
  const late = await plumeHeight(capturer);
  check(
    late >= early * 0.8,
    `${label}: the smoke plume is ${late.toFixed(1)} tall at clock 3600 but ${early.toFixed(1)} at the start — its noise drift left curlNoise's working range.`
  );
}

async function checkRender(kernel) {
  const options = {
    ...kernel.candle.defaultsFor('cli-still'),
    height: 320,
    pixelRatio: 1,
    svgIsotherms: 5,
    svgSmokeDots: 2,
    width: 180,
  };
  const capturer = await createCandleCapturer(kernel, {
    ...options,
    transparent: false,
  });
  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const pinned of [
      { bloom: false, flame: 'sim', settle: 2, smoke: 'curl' },
      { emberState: 'snuffed', flame: 'out', settle: 2, smoke: 'curl' },
      { flame: 'sim', look: 'cartoon', settle: 2, smoke: 'curl' },
      { flame: 'sim', look: 'clay', settle: 2, smoke: 'curl' },
      { flame: 'shader', look: 'realistic', settle: 2, smoke: 'billboard' },
      { flame: 'slices', look: 'realistic', settle: 2, smoke: 'ribbon' },
    ]) {
      const drawn = candleAt(kernel, {
        batch: 'check',
        index: 0,
        roll: { base: {}, keep: [], pinned },
      });
      // eslint-disable-next-line no-await-in-loop
      const { bounds } = await capturer.load(drawn.config, drawn.name, {
        options,
      });
      const view = kernel.candle.frameCandle({ bounds, options, view: 'end' });
      // eslint-disable-next-line no-await-in-loop
      const image = await capturer.capture(view);
      const label = `${pinned.look ?? 'realistic'} ${pinned.flame}`;
      check(!flat(image), `${label}: the render is flat.`);
      // eslint-disable-next-line no-await-in-loop
      const svg = await capturer.svg(view, options);
      check(
        svg.includes('slices') || svg.includes('contours'),
        `${label}: the plot has no wax line work.`
      );
      if (pinned.flame !== 'out') {
        check(svg.includes('isotherm'), `${label}: the plot has no isotherms.`);
      }
      if (pinned.flame === 'out' && pinned.smoke === 'curl') {
        // eslint-disable-next-line no-await-in-loop
        await checkSmokeAtLateClock(capturer, label);
      }
      if (pinned.flame === 'sim') {
        // eslint-disable-next-line no-await-in-loop
        await checkBottomFlameHidden(kernel, capturer, bounds, options, label);
      }
      check(svg.includes('pen-8 smoke'), `${label}: the plot has no smoke.`);
    }
  } finally {
    capturer.dispose();
  }
}

async function main() {
  await checkKernelPurity();
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'CandleWorkbenchPage.jsx'),
    RENDER_OPTIONS,
    check
  );
  await checkWorkbenchPage(
    path.join(TOOL_DIR, 'LiveCandle.jsx'),
    RENDER_OPTIONS,
    check
  );
  const candle = (await loadModules([KERNEL]))[KERNEL];
  await checkPresets(candle);
  checkRolls(candle);
  checkWax(candle);
  checkSignal(candle);
  if (process.argv.includes('--render')) await checkRender(await loadKernel());

  if (failures.length > 0) {
    console.error(`candle:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'candle:check — kernel, presets, rolls, wax, signal and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
