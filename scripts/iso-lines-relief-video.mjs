#!/usr/bin/env node
import { usageFor } from '../src/modules/isoLinesRelief/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  withCapturer,
} from './lib/isoLinesReliefRender.mjs';
import { runStage } from './lib/progress.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// Each piece is one shot: how many frames it runs for, and a stepper called
// once per frame, in order, on a fixed clock. build, rise and turntable hold
// the field still.
function planShot(kernel, drawn, options, aspect) {
  const { iso, relief } = kernel;
  const { config, image } = drawn;
  const { fps } = options;
  const builder = iso.createIsoBuilder();
  const { mode } = options;
  const segments = relief.segmentMode(config);

  if (mode === 'flow') {
    return {
      frames: Math.max(1, Math.round(options.hold * fps)),
      step: (frame) => ({
        build: builder.build(config, {
          aspect,
          image,
          mode: segments,
          time: frame / fps,
        }),
        motion: {},
      }),
    };
  }

  const build = builder.build(config, {
    aspect,
    image,
    mode: segments,
    time: 0,
  });
  if (mode === 'turntable') {
    return {
      frames: Math.max(1, Math.round(options.hold * fps)),
      step: () => ({ build, motion: {} }),
    };
  }
  const clock = { ...config, holdSeconds: options.hold };
  return {
    frames: Math.max(1, Math.round(relief.cycleSeconds(clock) * fps)),
    step: (frame) => ({
      build,
      motion: relief.motionState(mode, frame / fps, clock),
    }),
  };
}

runVideo({
  kernelLabel: 'IsoLinesRelief',
  loadKernel,
  nouns: 'pieces',
  overlay: sceneIconFile('iso-lines-relief'),
  parseCli,
  async plan({ kernel, options, typed }) {
    const { iso, relief } = kernel;
    const aspect = options.width / options.height;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? iso.randomSeed();
    const items = await runStage(`rolling ${options.count} pieces`, () =>
      Promise.all(
        Array.from({ length: options.count }, (_, index) =>
          pieceAt(kernel, { batch, index, roll })
        )
      )
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        const { frames, step } = planShot(kernel, drawn, options, aspect);
        return {
          enter: (capturer) => capturer.load(drawn, options.pixelRatio),
          frame(capturer, { frame }) {
            const { build, motion } = step(frame);
            return capturer.capture(
              relief.frameView({
                aspect,
                azimuthOffset:
                  options.mode === 'turntable'
                    ? (360 * options.turns * frame) / frames
                    : (options.orbit * frame) / frames,
                config: drawn.config,
                options,
                stable: true,
                view: options.view,
              }),
              build,
              motion
            );
          },
          frames,
        };
      }),
    };
  },
  script: 'iso-lines-relief',
  title: 'iso lines relief',
  usageFor,
  withCapturer,
});
