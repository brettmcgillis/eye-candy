#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/nestingBoxes/renderOptions.mjs';
import createFrameSink from './lib/frameSink.mjs';
import {
  REPO_ROOT,
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  settleBackdrop,
  treeAt,
  withCapturer,
} from './lib/nestingBoxesRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

// Clip seconds per tree, and growth progress at a clip time. `loop` is one
// whole grow → hold → shrink → rest cycle, so consecutive trees meet on the
// root box and the clip loops without a seam.
function plan(boxes, options, config) {
  if (options.mode === 'grow') {
    const clock = { ...config, growLoop: false };
    return {
      config,
      duration: config.levels * config.growLevelSeconds + options.hold,
      progressAt: (t) => boxes.growProgressAt(t, clock),
    };
  }
  if (options.mode === 'loop') {
    const clock = { ...config, growLoop: true };
    return {
      config,
      duration: boxes.growCycleSeconds(clock),
      progressAt: (t) => boxes.growProgressAt(t, clock),
    };
  }
  return {
    config:
      options.mode === 'drift' ? { ...config, driftEnabled: true } : config,
    duration: options.hold,
    progressAt: () => config.levels,
  };
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run nesting-boxes:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `nesting boxes video: mode ${options.mode}, ${options.count} trees, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the Nesting Boxes kernel', loadKernel);
  const { boxes } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? boxes.randomSeed();
  const items = Array.from({ length: options.count }, (_, index) => {
    const drawn = treeAt(kernel, { batch, index, roll });
    const timing = plan(boxes, options, drawn.config);
    return {
      drawn: { ...drawn, config: timing.config },
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
  const moving = options.mode === 'turntable' || options.orbit !== 0;
  const growing = options.mode === 'grow' || options.mode === 'loop';

  let written = 0;
  try {
    await withCapturer(kernel, options, async (capturer) => {
      for (let item = 0; item < items.length; item += 1) {
        const { frames, timing } = items[item];
        const drawn = await settleBackdrop(capturer, items[item].drawn, {
          options,
          roll,
        });
        items[item].drawn = drawn;
        const { config } = drawn;
        const bounds = await capturer.load(drawn);
        const motion = boxes.createMotion();

        for (let frame = 0; frame < frames; frame += 1) {
          const drift = motion.drift(config, frame === 0 ? 0 : dt);
          const azimuthOffset =
            options.mode === 'turntable'
              ? (360 * options.turns * frame) / frames
              : (options.orbit * written) / total;
          const image = await capturer.capture(
            frameView({
              azimuthOffset,
              bounds: growing ? bounds.all : bounds.settled,
              options,
              stable: moving,
              view: options.view,
            }),
            { drift, progress: timing.progressAt(frame * dt) }
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
