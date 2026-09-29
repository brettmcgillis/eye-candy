#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/blockParty/renderOptions.mjs';
import {
  REPO_ROOT,
  cityAt,
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/blockPartyRender.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';
const BUILD_TAIL = 0.05;

// Clip seconds per city, and the build clock at a clip time. The clock runs
// at the city's own buildSeconds, the way the scene's does.
function plan(options, config) {
  const rate = 1 / Math.max(config.buildSeconds, 0.01);

  if (options.mode === 'build') {
    return {
      duration:
        config.buildSeconds * (1 + config.revealBand + BUILD_TAIL) +
        options.hold,
      start: 0,
      rate,
    };
  }
  return { duration: options.hold, rate, start: null };
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run block-party:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `block party video: mode ${options.mode}, ${options.count} cities, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the Block Party kernel', loadKernel);
  const { city } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? city.randomSeed();
  const items = Array.from({ length: options.count }, (_, index) => {
    const drawn = cityAt(kernel, { batch, index, roll });
    const timing = plan(options, drawn.config);
    return {
      drawn,
      frames: Math.max(1, Math.round(timing.duration * options.fps)),
      timing,
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
  const dt = 1 / options.fps;

  let written = 0;
  try {
    await withCapturer(kernel, options, async (capturer) => {
      for (let item = 0; item < items.length; item += 1) {
        const { drawn, frames, timing } = items[item];
        const { config } = drawn;
        const bounds = capturer.load(drawn);
        const rebuild =
          options.mode === 'rebuild'
            ? city.createRebuildState(capturer.model(), {
                order: config.rebuildOrder,
                seed: config.seed,
              })
            : null;
        let clock = timing.start ?? city.SETTLED;

        for (let frame = 0; frame < frames; frame += 1) {
          const seconds = frame * dt;
          if (frame > 0) clock += dt * timing.rate;
          if (
            rebuild &&
            frame > 0 &&
            city.stepRebuild(rebuild, {
              clock,
              composition: city.compositionOf(config),
              enabled: true,
              every: config.rebuildSeconds,
              referenceHeight: config.referenceHeight,
              revealBand: config.revealBand,
              seconds: dt,
            })
          ) {
            capturer.setCells(city.cellsOf(rebuild));
          }
          const azimuthOffset =
            options.mode === 'turntable'
              ? (360 * options.turns * frame) / frames
              : (options.orbit * written) / total;
          const image = await capturer.capture(
            frameView(kernel, {
              azimuthOffset,
              bounds,
              options,
              stable: options.mode === 'turntable' || options.orbit !== 0,
              view: options.view,
            }),
            { clock, time: seconds }
          );
          await sink.write(image.data);
          written += 1;
          progress.update(written);
        }
      }
    });
  } finally {
    await runStage('finishing encode', () => sink.finish());
  }
  progress.done('rendered frames');

  const metadataPath = await writeVideoSidecar(out, {
    presets: items.map(({ drawn }) => drawn.config),
    render: { ...options, base: undefined, palettes: undefined },
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
