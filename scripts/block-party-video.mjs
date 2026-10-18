#!/usr/bin/env node
import { usageFor } from '../src/modules/blockParty/renderOptions.mjs';
import {
  cityAt,
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/blockPartyRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

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

runVideo({
  kernelLabel: 'Block Party',
  loadKernel,
  nouns: 'cities',
  overlay: sceneIconFile('block-party'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { city } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? city.randomSeed();
    const dt = 1 / options.fps;
    const stable = options.mode === 'turntable' || options.orbit !== 0;
    const items = Array.from({ length: options.count }, (_, index) => {
      const drawn = cityAt(kernel, { batch, index, roll });
      const timing = plan(options, drawn.config);
      return {
        drawn,
        frames: Math.max(1, Math.round(timing.duration * options.fps)),
        timing,
      };
    });
    return {
      presets: () => items.map(({ drawn }) => drawn.config),
      shots: items.map(({ drawn, frames, timing }) => {
        const { config } = drawn;
        let bounds = null;
        let rebuild = null;
        let clock = timing.start ?? city.SETTLED;
        return {
          enter(capturer) {
            bounds = capturer.load(drawn);
            rebuild =
              options.mode === 'rebuild'
                ? city.createRebuildState(capturer.model(), {
                    order: config.rebuildOrder,
                    seed: config.seed,
                  })
                : null;
          },
          frame(capturer, frameClock) {
            const { frame, seconds } = frameClock;
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
            return capturer.capture(
              frameView(kernel, {
                azimuthOffset: azimuthOffset(options, frameClock),
                bounds,
                options,
                stable,
                view: options.view,
              }),
              { clock, time: seconds }
            );
          },
          frames,
        };
      }),
    };
  },
  script: 'block-party',
  title: 'block party',
  usageFor,
  withCapturer,
});
