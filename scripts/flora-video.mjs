#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

import { usageFor } from '../src/modules/flora/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import {
  REPO_ROOT,
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
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';
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

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run flora:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { typed } = parsed;
  const options = { ...parsed.options, version: await readPackageVersion() };
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
  const sourceFiles = options.in
    ? await collectExisting(
        path.resolve(REPO_ROOT, options.in),
        options.view,
        options.imageFormat
      )
    : null;
  if (sourceFiles && sourceFiles.length === 0) {
    throw new Error(
      `no ${options.view}.${options.imageFormat} files found in ${options.in}`
    );
  }
  const roll = sourceFiles ? null : rollArgs(kernel, { options, typed });
  const items = sourceFiles
    ? sourceFiles.map((file) => ({
        file,
        frames: Math.max(1, Math.round(options.hold * options.fps)),
      }))
    : Array.from({ length: options.count }, (_, index) => {
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
    if (sourceFiles) {
      for (let item = 0; item < items.length; item += 1) {
        const frame = await readSourceFrame(
          items[item].file,
          options.width * options.pixelRatio,
          options.height * options.pixelRatio
        );
        for (let index = 0; index < items[item].frames; index += 1) {
          await sink.write(frame);
          written += 1;
          progress.update(written);
        }
      }
    } else {
      await withCapturer(kernel, options, async (capturer) => {
        for (let item = 0; item < items.length; item += 1) {
          const { drawn, frames, itemOptions, levels } = items[item];
          const flowers = await progress.stage(
            `growing ${drawn.bouquet ? `bouquet-${drawn.seed}` : drawn.seed}`,
            async () => buildFlowers(kernel, { ...drawn, options: itemOptions })
          );
          const bounds = capturer.setFlowers(flowers);
          let still = null;

          for (let frame = 0; frame < frames; frame += 1) {
            const seconds = frame / options.fps;
            if (options.mode === 'stills' && still) {
              await sink.write(still);
            } else {
              const azimuthOffset = azimuthFor(options, {
                frame,
                frames,
                total,
                written,
              });
              const image = await capturer.capture({
                ...frameView(kernel, {
                  azimuthOffset,
                  bounds,
                  options,
                  view: options.view,
                }),
                levels: levels(seconds),
              });
              still = options.overlay
                ? await encodeFrame(image, 'raw', options)
                : image.data;
              await sink.write(still);
            }
            written += 1;
            progress.update(written);
          }
          if (
            options.stillsOut &&
            ['stills', 'growth'].includes(options.mode) &&
            still
          ) {
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
          }
        }
      });
    }
  } finally {
    await runStage('finishing encode', () => sink.finish());
  }
  progress.done('rendered frames');

  const render = { ...options, base: undefined, bouquet: undefined };
  const metadataPath = await writeVideoSidecar(out, {
    bouquets: sourceFiles
      ? []
      : items
          .filter(({ drawn }) => drawn.bouquet)
          .map(({ drawn }) => ({ flowers: drawn.configs, seed: drawn.seed })),
    presets: sourceFiles ? [] : items.flatMap(({ drawn }) => drawn.configs),
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
