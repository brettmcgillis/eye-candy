#!/usr/bin/env node
import { usageFor } from '../src/modules/birdsArentReal/renderOptions.mjs';
import {
  flockAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/birdsArentRealRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// One shot per flock: it settles, then keeps looking round for `hold`
// seconds while the camera holds, drifts or (turntable) circles it.
runVideo({
  kernelLabel: 'BirdsArentReal',
  loadKernel,
  nouns: 'flocks',
  overlay: sceneIconFile('birds-arent-real'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { birds } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? birds.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      flockAt(kernel, { batch, index, roll })
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        let settled = null;
        return {
          async enter(capturer) {
            settled = await capturer.load(drawn.config, options);
          },
          frame: (capturer, clock) =>
            capturer.capture(
              birds.frameFlock({
                azimuthOffset: azimuthOffset(options, clock),
                bounds: settled.bounds,
                config: drawn.config,
                options,
                view: options.view,
              }),
              settled.start + clock.frame / options.fps
            ),
          frames: Math.max(1, Math.round(options.hold * options.fps)),
        };
      }),
    };
  },
  script: 'birds-arent-real',
  title: 'birdsarentreal',
  usageFor,
  withCapturer,
});
