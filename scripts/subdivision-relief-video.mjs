#!/usr/bin/env node
import { usageFor } from '../src/modules/subdivisionRelief/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import { runStage } from './lib/progress.mjs';
import {
  assertPalette,
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  withCapturer,
} from './lib/subdivisionReliefRender.mjs';

// growth: the scene's loop, clip by clip; motion and sway hold the grown
// piece. sway swings the camera `turns` times either side of the view; the
// others drift by `orbit` across the whole video.
function yawFor(options, { frame, frames, total, written }) {
  if (options.mode === 'sway') {
    return (
      options.orbit * Math.sin((2 * Math.PI * options.turns * frame) / frames)
    );
  }
  return (options.orbit * written) / total;
}

runVideo({
  kernelLabel: 'SubdivisionRelief',
  loadKernel,
  nouns: 'pieces',
  parseCli,
  async plan({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    const { relief } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const items = await runStage(`laying out ${options.count} pieces`, () =>
      Promise.all(
        Array.from({ length: options.count }, (_, index) =>
          pieceAt(kernel, { index, options, roll })
        )
      )
    );
    const seconds =
      options.mode === 'growth'
        ? relief.cycleSeconds(options)
        : options.holdSeconds;
    const frames = Math.max(1, Math.round(seconds * options.fps));

    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        const top = drawn.piece.maxDepth + 1;
        return {
          enter: (capturer) => capturer.load(drawn),
          exit: ({ progress }) =>
            progress.log(`rendered ${drawn.name} (${frames} frames)`),
          frame(capturer, clock) {
            return capturer.capture(
              relief.frameView({
                config: drawn.config,
                options,
                piece: drawn.piece,
                stable: true,
                view: options.view,
                yawOffset: yawFor(options, clock),
              }),
              {
                grow:
                  options.mode === 'growth'
                    ? relief.growAt(clock.seconds, options, top)
                    : top,
                motion: relief.motionAt(drawn.config, clock.seconds),
              }
            );
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
  script: 'subdivision-relief',
  title: 'subdivision relief',
  usageFor,
  withCapturer,
});
