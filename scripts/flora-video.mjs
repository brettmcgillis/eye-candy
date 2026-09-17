#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/flora/renderOptions.mjs';
import {
  REPO_ROOT,
  assertPalette,
  buildFlowers,
  flowersAt,
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/floraRender.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';
const GROWN = { bloom: 1, exit: 0, growth: 1 };

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

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run flora:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `flora video: mode ${options.mode}, ${options.count} items, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the Flora kernel', loadKernel);
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed });
  const items = Array.from({ length: options.count }, (_, index) => {
    const drawn = flowersAt(kernel, { index, options, roll });
    const { duration, levels } = plan(kernel, options, drawn.configs);
    return {
      drawn,
      frames: Math.max(1, Math.round(duration * options.fps)),
      levels,
    };
  });
  const total = items.reduce((sum, item) => sum + item.frames, 0);
  const progress = createProgress('rendering frames', total);
  const sink = createFrameSink({
    fps: options.fps,
    height: options.height * options.pixelRatio,
    out,
    width: options.width * options.pixelRatio,
  });

  let written = 0;
  try {
    await withCapturer(kernel, options, async (capturer) => {
      for (let item = 0; item < items.length; item += 1) {
        const { drawn, frames, levels } = items[item];
        const flowers = await progress.stage(
          `growing ${drawn.bouquet ? `bouquet-${drawn.seed}` : drawn.seed}`,
          async () => buildFlowers(kernel, { ...drawn, options })
        );
        const bounds = capturer.setFlowers(flowers);
        let still = null;

        for (let frame = 0; frame < frames; frame += 1) {
          const seconds = frame / options.fps;
          if (options.mode === 'stills' && still) {
            await sink.write(still);
          } else {
            const azimuthOffset =
              options.mode === 'turntable'
                ? (360 * options.turns * frame) / frames
                : (options.orbit * written) / total;
            const image = await capturer.capture({
              ...frameView(kernel, {
                azimuthOffset,
                bounds,
                options,
                view: options.view,
              }),
              levels: levels(seconds),
            });
            still = image.data;
            await sink.write(image.data);
          }
          written += 1;
          progress.update(written);
        }
      }
    });
  } finally {
    await runStage('finishing encode', () => sink.finish());
  }
  progress.done('rendered frames');

  const render = { ...options, base: undefined, bouquet: undefined };
  const metadataPath = await writeVideoSidecar(out, {
    bouquets: items
      .filter(({ drawn }) => drawn.bouquet)
      .map(({ drawn }) => ({ flowers: drawn.configs, seed: drawn.seed })),
    presets: items.flatMap(({ drawn }) => drawn.configs),
    render,
  });
  process.stdout.write(
    `saved video: ${out}\nsaved metadata: ${metadataPath}\n`
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
