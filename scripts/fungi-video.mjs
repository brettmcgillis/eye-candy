#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/fungi/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import createFrameSink from './lib/frameSink.mjs';
import {
  REPO_ROOT,
  encodeFrame,
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  specimenAt,
  withCapturer,
} from './lib/fungiRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

// Seconds of clip per specimen, and its levels at a clip time. The lifecycle
// clock runs at the specimen's own timeScale, the way the scene does.
function plan(kernel, options, config) {
  const { fungi } = kernel;
  const speed = config.timeScale || 1;
  const { cycleEnd, matured } = fungi.timeline(config);
  const grown = (specimen) => fungi.stillLevels(specimen, { grow: 1, rot: 0 });

  if (options.mode === 'lifecycle') {
    return {
      duration: cycleEnd / speed,
      levels: (seconds) => (specimen) =>
        fungi.specimenLevels(config, specimen, seconds * speed),
    };
  }
  if (options.mode === 'growth') {
    return {
      duration: matured / speed + options.hold,
      levels: (seconds) => (specimen) => {
        const t = Math.min(seconds * speed, matured);
        return {
          ...fungi.specimenLevels(config, specimen, t),
          rot: 0,
          spore: 0,
        };
      },
    };
  }
  return { duration: options.hold, levels: () => grown };
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run fungi:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { typed } = parsed;
  const options = { ...parsed.options, version: await readPackageVersion() };
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `fungi video: mode ${options.mode}, ${options.count} specimens, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the Fungi kernel', loadKernel);
  const roll = rollArgs(kernel, { options, typed });
  const items = Array.from({ length: options.count }, (_, index) => {
    const drawn = specimenAt(kernel, { index, options, roll });
    const { duration, levels } = plan(kernel, options, drawn.config);
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
        const bounds = capturer.load(drawn);
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
            still = options.overlay
              ? await encodeFrame(image, 'raw', options)
              : image.data;
            await sink.write(still);
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

  const metadataPath = await writeVideoSidecar(out, {
    presets: items.map(({ drawn }) => drawn.config),
    render: { ...options, base: undefined },
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
