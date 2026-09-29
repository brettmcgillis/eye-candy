#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/subdivision/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  assertPalette,
  buildPieceFor,
  loadKernel,
  parseCli,
  pieceAt,
  rasterSize,
  rawFrame,
  rollArgs,
} from './lib/subdivisionRender.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

// The scene's loop, clip by clip: grow level by level, hold, collapse.
function timeline(options, top) {
  if (options.mode === 'stills') {
    return { growAt: () => Infinity, seconds: options.holdSeconds };
  }
  const { collapseSeconds, growSeconds, holdSeconds } = options;
  return {
    growAt(seconds) {
      if (seconds < growSeconds) return (seconds / growSeconds) * top;
      const collapsing = seconds - growSeconds - holdSeconds;
      if (collapsing <= 0) return top;
      return top * Math.max(0, 1 - collapsing / collapseSeconds);
    },
    seconds: growSeconds + holdSeconds + collapseSeconds,
  };
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run subdivision:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const options = { ...parsed.options, version: await readPackageVersion() };
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `subdivision video: mode ${options.mode}, ${options.count} pieces, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\noutput: ${out}\n`
  );

  const kernel = await runStage('loading the Subdivision kernel', loadKernel);
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed: parsed.typed });
  const items = Array.from({ length: options.count }, (_, index) =>
    pieceAt(kernel, { index, options, roll })
  );
  const { holdSeconds, fps } = options;
  const perItem =
    options.mode === 'stills'
      ? holdSeconds
      : options.growSeconds + holdSeconds + options.collapseSeconds;
  const framesPer = Math.max(1, Math.round(perItem * fps));
  const progress = createProgress('rendering frames', framesPer * items.length);
  const size = rasterSize(options);
  const sink = createFrameSink({
    fps,
    height: size.height,
    out,
    width: size.width,
  });

  let written = 0;
  try {
    for (let item = 0; item < items.length; item += 1) {
      const { config, seed } = items[item];
      const piece = await progress.stage(`laying out ${seed}`, () =>
        buildPieceFor(kernel, config, options)
      );
      const clip = timeline(options, kernel.subdivision.fullyGrown(piece));
      let last = { frame: null, grow: null };

      for (let frame = 0; frame < framesPer; frame += 1) {
        const grow = clip.growAt(frame / fps);
        if (grow !== last.grow) {
          last = {
            frame: await rawFrame(kernel, piece, config, options, grow),
            grow,
          };
        }
        await sink.write(last.frame);
        written += 1;
        progress.update(written);
      }
      progress.log(`rendered ${seed} (${framesPer} frames)`);
    }
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
