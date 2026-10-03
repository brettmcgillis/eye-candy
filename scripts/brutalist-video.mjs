#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/brutalist/renderOptions.mjs';
import {
  REPO_ROOT,
  loadKernel,
  parseCli,
  rollArgs,
  structureAt,
  withCapturer,
} from './lib/brutalistRender.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';
const DRIFT_FROM = 1.25;
const DRIFT_TO = 0.85;

const ease = (t) => t * t * (3 - 2 * t);

// The camera for one frame. Nothing in the scene moves but the fog, so a
// clip is a camera move over a still structure, with the fog drifting on
// the clip's own clock.
function framingAt(capturer, options, frame, frames) {
  const t = frames > 1 ? frame / (frames - 1) : 0;
  if (options.mode === 'turntable') {
    return capturer.frame(options, options.view, {
      azimuthOffset: 360 * options.turns * t,
      stable: true,
    });
  }
  return capturer.frame(options, options.view, {
    distanceScale: DRIFT_FROM + (DRIFT_TO - DRIFT_FROM) * ease(t),
  });
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run brutalist:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `brutalist video (${options.stage}): mode ${options.mode}, ${options.count} structures, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the Brutalist kernel', loadKernel);
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? kernel.brutalist.randomSeed();
  const items = Array.from({ length: options.count }, (_, index) =>
    structureAt(kernel, { batch, index, roll })
  );
  const frames = Math.max(1, Math.round(options.hold * options.fps));
  const progress = createProgress('rendering frames', frames * items.length);
  const sink = createFrameSink({
    fps: options.fps,
    height: options.height * options.pixelRatio,
    out,
    width: options.width * options.pixelRatio,
  });

  let written = 0;
  try {
    await withCapturer(kernel, options, async (capturer) => {
      for (let s = 0; s < items.length; s += 1) {
        capturer.load(items[s]);
        for (let frame = 0; frame < frames; frame += 1) {
          const image = await capturer.capture(
            framingAt(capturer, options, frame, frames),
            frame / options.fps
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
    presets: items.map(({ config }) => config),
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
