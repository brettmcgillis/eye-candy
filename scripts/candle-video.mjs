#!/usr/bin/env node
import { usageFor } from '../src/modules/candle/renderOptions.mjs';
import {
  candleAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/candleRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// One shot per candle: it settles, then burns for `hold` seconds while the
// camera holds, drifts or (turntable) circles it. `snuff` puts the flames
// out halfway through the shot; `montage` holds one still per candle.
runVideo({
  kernelLabel: 'Candle',
  loadKernel,
  nouns: 'candles',
  overlay: sceneIconFile('candle'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { candle } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? candle.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      candleAt(kernel, { batch, index, roll })
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        let settled = null;
        let held = null;
        const snuffAt =
          options.mode === 'snuff'
            ? (drawn.config.settle ?? 0) + options.hold / 2
            : null;
        return {
          async enter(capturer) {
            held = null;
            settled = await capturer.load(drawn.config, drawn.name, {
              options,
              snuffAt,
            });
          },
          async frame(capturer, clock) {
            if (options.mode === 'montage' && held) return held;
            const image = await capturer.capture(
              candle.frameCandle({
                azimuthOffset: azimuthOffset(options, clock),
                bounds: settled.bounds,
                options,
                view: options.view,
              }),
              options.mode === 'montage'
                ? settled.start
                : settled.start + clock.frame / options.fps
            );
            if (options.mode === 'montage') held = image;
            return image;
          },
          frames: Math.max(1, Math.round(options.hold * options.fps)),
        };
      }),
    };
  },
  script: 'candle',
  title: 'candle',
  usageFor,
  withCapturer,
});
