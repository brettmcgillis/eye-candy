#!/usr/bin/env node
import { usageFor } from '../src/modules/cumulus/renderOptions.mjs';
import { loadKernel, parseCli, withCapturer } from './lib/cumulusRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runVideo({
  kernelLabel: 'Cumulus',
  loadKernel,
  parseCli,
  withCapturer,
  usageFor,
  nouns: 'thoughts',
  script: 'cumulus',
  title: 'cumulus',
  overlay: sceneIconFile('cumulus'),
  plan({ kernel: { thoughts }, options, typed }) {
    const batch = options.batch ?? thoughts.randomSeed();
    const roll = thoughts.rollArgs({ options, typed });
    const items = Array.from({ length: options.count }, (_, index) =>
      thoughts.thoughtAt({ batch, index, roll })
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        let bounds;
        return {
          frames: Math.max(1, Math.round(options.hold * options.fps)),
          async enter(capturer) {
            bounds = await capturer.load(drawn);
          },
          frame: (capturer, clock) =>
            capturer.capture(
              thoughts.frameThought({
                azimuthOffset: azimuthOffset(options, clock),
                bounds,
                config: drawn.config,
                options,
                view: options.view,
              }),
              drawn.config.frameTime +
                (options.mode === 'montage' ? 0 : clock.frame / options.fps)
            ),
        };
      }),
    };
  },
});
