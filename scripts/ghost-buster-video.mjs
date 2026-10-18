#!/usr/bin/env node
import { usageFor } from '../src/modules/ghostBuster/renderOptions.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import {
  ghostAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/ghostBusterRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// One shot per ghost: it settles, then keeps drifting in its wind for
// `hold` seconds while the camera holds, drifts or (turntable) circles it.
runVideo({
  kernelLabel: 'GhostBuster',
  loadKernel,
  nouns: 'ghosts',
  overlay: sceneIconFile('ghost-buster'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { ghost } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? ghost.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      ghostAt(kernel, { batch, index, roll })
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        let settled = null;
        return {
          async enter(capturer) {
            settled = await capturer.load(drawn.config);
          },
          frame: (capturer, clock) =>
            capturer.capture(
              ghost.frameGhost({
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
  script: 'ghost-buster',
  title: 'ghostbuster',
  usageFor,
  withCapturer,
});
