#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import { usageFor } from '../src/modules/flora/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import {
  assertPalette,
  buildFlowers,
  encodeFrame,
  flowersAt,
  frameView,
  loadKernel,
  parseCli,
  resolveItemOptions,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/floraRender.mjs';
import { REPO_ROOT, runVideo } from './lib/generatorCli.mjs';

const GROWN = { bloom: 1, exit: 0, growth: 1 };

async function collectExisting(dir, view, format) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(dir, name, `${view}.${format}`));
}

async function readSourceFrame(file, width, height) {
  return sharp(file).resize(width, height).ensureAlpha().raw().toBuffer();
}

async function saveSourceFrame({ drawn, frame, options, sequence }) {
  if (!options.stillsOut) return;
  const outputDir = path.join(
    path.resolve(REPO_ROOT, options.stillsOut),
    String(drawn.seed)
  );
  const image = await sharp(frame, {
    raw: {
      channels: 4,
      height: options.height * options.pixelRatio,
      width: options.width * options.pixelRatio,
    },
  })
    [options.imageFormat]({ lossless: true })
    .toBuffer();
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(outputDir, `${options.view}.${options.imageFormat}`),
      image
    ),
    writeFile(
      path.join(outputDir, 'props.json'),
      `${JSON.stringify(
        {
          ...sidecarFor({ ...drawn, options }),
          ...(sequence ? { sequence } : {}),
        },
        null,
        2
      )}\n`
    ),
  ]);
}

// Turntable spins per flower (resetting at every cut) or once across the
// whole clip (climbing with the global frame count, never resetting); other
// modes drift by `orbit` across the whole clip the same way.
function azimuthFor(options, { frame, frames, total, written }) {
  if (options.mode !== 'turntable') return (options.orbit * written) / total;
  if (options.turntableSpan === 'video') {
    return (360 * options.turns * written) / total;
  }
  return (360 * options.turns * frame) / frames;
}

// Seconds of clip per drawn item, and the flower levels at a clip time. The
// lifecycle clock runs at each flower's own timeScale, the way the scene does.
function plan(kernel, options, configs) {
  const { flora } = kernel;
  const scaled = (config, key) =>
    flora.timeline(config)[key] / (config.timeScale || 1);

  if (options.mode === 'lifecycle') {
    return {
      duration: Math.max(...configs.map((c) => scaled(c, 'cycleEnd'))),
      levels: (seconds) => (config) =>
        flora.levelsAt(config, seconds * (config.timeScale || 1)),
    };
  }
  if (options.mode === 'growth') {
    return {
      duration:
        Math.max(...configs.map((c) => scaled(c, 'matured'))) + options.hold,
      levels: (seconds) => (config) => ({
        ...flora.levelsAt(config, seconds * (config.timeScale || 1)),
        exit: 0,
      }),
    };
  }
  return { duration: options.hold, levels: () => () => GROWN };
}

// Each flower's shot; `--in` instead re-cuts saved stills with no GPU.
function flowerShots(kernel, options, roll) {
  const items = Array.from({ length: options.count }, (_, index) => {
    const drawn = flowersAt(kernel, { index, options, roll });
    const itemOptions = resolveItemOptions(kernel, options, drawn.seed);
    const { duration, levels } = plan(kernel, options, drawn.configs);
    return {
      drawn,
      frames: Math.max(1, Math.round(duration * options.fps)),
      itemOptions,
      levels,
    };
  });
  const shots = items.map(({ drawn, frames, itemOptions, levels }, item) => {
    let bounds = null;
    let still = null;
    return {
      async enter(capturer, { progress }) {
        const flowers = await progress.stage(
          `growing ${drawn.bouquet ? `bouquet-${drawn.seed}` : drawn.seed}`,
          async () => buildFlowers(kernel, { ...drawn, options: itemOptions })
        );
        bounds = capturer.setFlowers(flowers);
      },
      async exit({ progress }) {
        if (
          !options.stillsOut ||
          !['stills', 'growth'].includes(options.mode) ||
          !still
        ) {
          return;
        }
        await saveSourceFrame({
          drawn,
          frame: still,
          options: itemOptions,
          sequence:
            options.mode === 'growth'
              ? { index: item, total: items.length }
              : undefined,
        });
        progress.log(
          `saved source: ${path.join(options.stillsOut, String(drawn.seed))}`
        );
      },
      async frame(capturer, clock) {
        if (options.mode === 'stills' && still) return still;
        const image = await capturer.capture({
          ...frameView(kernel, {
            azimuthOffset: azimuthFor(options, clock),
            bounds,
            options,
            view: options.view,
          }),
          levels: levels(clock.seconds),
        });
        still = options.overlay
          ? await encodeFrame(image, 'raw', options)
          : image.data;
        return still;
      },
      frames,
    };
  });
  return {
    presets: () => items.flatMap(({ drawn }) => drawn.configs),
    shots,
    sidecar: () => ({
      bouquets: items
        .filter(({ drawn }) => drawn.bouquet)
        .map(({ drawn }) => ({ flowers: drawn.configs, seed: drawn.seed })),
    }),
  };
}

async function sourceShots(options) {
  const files = await collectExisting(
    path.resolve(REPO_ROOT, options.in),
    options.view,
    options.imageFormat
  );
  if (files.length === 0) {
    throw new Error(
      `no ${options.view}.${options.imageFormat} files found in ${options.in}`
    );
  }
  return {
    gpu: false,
    presets: () => [],
    shots: files.map((file) => {
      let frame = null;
      return {
        async enter() {
          frame = await readSourceFrame(
            file,
            options.width * options.pixelRatio,
            options.height * options.pixelRatio
          );
        },
        frame: () => frame,
        frames: Math.max(1, Math.round(options.hold * options.fps)),
      };
    }),
    sidecar: () => ({ bouquets: [] }),
  };
}

runVideo({
  kernelLabel: 'Flora',
  loadKernel,
  nouns: 'items',
  parseCli,
  plan({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return options.in
      ? sourceShots(options)
      : flowerShots(kernel, options, rollArgs(kernel, { options, typed }));
  },
  prepare: async (options) => ({
    ...options,
    version: await readPackageVersion(),
  }),
  script: 'flora',
  title: 'flora',
  usageFor,
  withCapturer,
});
