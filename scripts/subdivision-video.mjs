#!/usr/bin/env node
import { usageFor } from '../src/modules/subdivision/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  assertPalette,
  buildPieceFor,
  loadKernel,
  parseCli,
  pieceAt,
  rasterSize,
  rawFrame,
  rollArgs,
} from './lib/subdivisionRender.mjs';

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

runVideo({
  kernelLabel: 'Subdivision',
  loadKernel,
  nouns: 'pieces',
  parseCli,
  plan({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    const roll = rollArgs(kernel, { options, typed });
    const items = Array.from({ length: options.count }, (_, index) =>
      pieceAt(kernel, { index, options, roll })
    );
    const { fps, holdSeconds } = options;
    const perItem =
      options.mode === 'stills'
        ? holdSeconds
        : options.growSeconds + holdSeconds + options.collapseSeconds;
    const frames = Math.max(1, Math.round(perItem * fps));
    return {
      gpu: false,
      presets: () => items.map(({ config }) => config),
      shots: items.map(({ config, seed }) => {
        let piece = null;
        let clip = null;
        let last = { frame: null, grow: null };
        return {
          async enter(capturer, { progress }) {
            piece = await progress.stage(`laying out ${seed}`, () =>
              buildPieceFor(kernel, config, options)
            );
            clip = timeline(options, kernel.subdivision.fullyGrown(piece));
          },
          exit: ({ progress }) =>
            progress.log(`rendered ${seed} (${frames} frames)`),
          async frame(capturer, { seconds }) {
            const grow = clip.growAt(seconds);
            if (grow !== last.grow) {
              last = {
                frame: await rawFrame(kernel, piece, config, options, grow),
                grow,
              };
            }
            return last.frame;
          },
          frames,
        };
      }),
    };
  },
  prepare: async (options) => ({
    ...options,
    version: await readPackageVersion(),
  }),
  script: 'subdivision',
  size: rasterSize,
  title: 'subdivision',
  usageFor,
});
