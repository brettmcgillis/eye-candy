#!/usr/bin/env node
import { usageFor } from '../src/modules/dumpsterFire/renderOptions.mjs';
import {
  fireAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/dumpsterFireRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// One shot per fire: it settles, then keeps burning for `hold` seconds
// while the camera holds, drifts or (turntable) circles the dumpster.
runVideo({
  kernelLabel: 'DumpsterFire',
  loadKernel,
  nouns: 'fires',
  overlay: sceneIconFile('dumpster-fire'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { fire } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? fire.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      fireAt(kernel, { batch, index, roll })
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        let settled = null;
        return {
          async enter(capturer) {
            settled = await capturer.load(drawn.config, drawn.name);
          },
          frame: (capturer, clock) =>
            capturer.capture(
              fire.frameDumpster({
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
  script: 'dumpster-fire',
  title: 'dumpsterfire',
  usageFor,
  withCapturer,
});
