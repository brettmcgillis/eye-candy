#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/trucheterieBlob/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  assertPalette,
  encodeFrame,
  fieldAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/trucheterieBlobRender.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';
// A touch past 1 so the outermost ring of a coarse (few-lane) family clears
// blobShader.js's GROWTH_AA falloff and reads as fully solid, not half-drawn.
const FULLY_GROWN = 1.05;

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run trucheterie:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { typed } = parsed;
  const options = { ...parsed.options, version: await readPackageVersion() };
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `trucheterie video: mode ${options.mode}, ${options.count} fields, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage(
    'loading the Trucheterie blob-field kernel',
    loadKernel
  );
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed });

  const grown = options.mode === 'growth';
  const items = Array.from({ length: options.count }, (_, index) => {
    const drawn = fieldAt(kernel, { index, options, roll });
    const seconds = grown ? options.growSeconds + options.hold : options.hold;
    return { drawn, frames: Math.max(1, Math.round(seconds * options.fps)) };
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
        const { drawn, frames } = items[item];
        const bounds = await progress.stage(
          `laying out ${drawn.seed}`,
          async () => capturer.setField(drawn.config)
        );
        let cachedStill = null;

        for (let frame = 0; frame < frames; frame += 1) {
          const seconds = frame / options.fps;
          let still;
          if (grown) {
            capturer.setGrowth(
              Math.min(FULLY_GROWN, seconds / options.growSeconds)
            );
            capturer.setPalettePhase(seconds * options.paletteDrift);
            const image = await capturer.capture({
              backgroundColor: drawn.config.sceneBgColor,
              bounds,
              margin: options.margin,
              transparentBackground: options.transparentBackground,
            });
            still = options.overlay
              ? await encodeFrame(image, 'raw', options)
              : image.data;
          } else if (cachedStill) {
            still = cachedStill;
          } else {
            const image = await capturer.capture({
              backgroundColor: drawn.config.sceneBgColor,
              bounds,
              margin: options.margin,
              transparentBackground: options.transparentBackground,
            });
            still = options.overlay
              ? await encodeFrame(image, 'raw', options)
              : image.data;
            cachedStill = still;
          }
          await sink.write(still);
          written += 1;
          progress.update(written);
        }
        progress.log(`rendered ${drawn.seed} (${frames} frames)`);
      }
    });
  } finally {
    await runStage('finishing encode', () => sink.finish());
  }
  progress.done('rendered frames');

  const render = { ...options, base: undefined };
  const metadataPath = await writeVideoSidecar(out, {
    presets: items.map(({ drawn }) => drawn.config),
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
