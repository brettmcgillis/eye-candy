#!/usr/bin/env node
import { usageFor } from '../src/modules/nestingBoxes/renderOptions.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import {
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  settleBackdrop,
  treeAt,
  withCapturer,
} from './lib/nestingBoxesRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

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

runVideo({
  kernelLabel: 'Nesting Boxes',
  loadKernel,
  nouns: 'trees',
  overlay: sceneIconFile('nesting-boxes'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { boxes } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? boxes.randomSeed();
    const dt = 1 / options.fps;
    const moving = options.mode === 'turntable' || options.orbit !== 0;
    const growing = options.mode === 'grow' || options.mode === 'loop';
    const items = Array.from({ length: options.count }, (_, index) => {
      const drawn = treeAt(kernel, { batch, index, roll });
      const timing = plan(boxes, options, drawn.config);
      return {
        drawn: { ...drawn, config: timing.config },
        frames: Math.max(1, Math.round(timing.duration * options.fps)),
        timing,
      };
    });
    return {
      presets: () => items.map(({ drawn }) => drawn.config),
      shots: items.map((item) => {
        let bounds = null;
        let motion = null;
        return {
          async enter(capturer) {
            // eslint-disable-next-line no-param-reassign
            item.drawn = await settleBackdrop(capturer, item.drawn, {
              options,
              roll,
            });
            bounds = await capturer.load(item.drawn);
            motion = boxes.createMotion();
          },
          frame: (capturer, clock) =>
            capturer.capture(
              frameView({
                azimuthOffset: azimuthOffset(options, clock),
                bounds: growing ? bounds.all : bounds.settled,
                options,
                stable: moving,
                view: options.view,
              }),
              {
                drift: motion.drift(
                  item.drawn.config,
                  clock.frame === 0 ? 0 : dt
                ),
                progress: item.timing.progressAt(clock.frame * dt),
              }
            ),
          frames: item.frames,
        };
      }),
    };
  },
  script: 'nesting-boxes',
  title: 'nesting boxes',
  usageFor,
  withCapturer,
});
