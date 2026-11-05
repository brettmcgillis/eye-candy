#!/usr/bin/env node
import { usageFor } from '../src/modules/cables/renderOptions.mjs';
import {
  generationAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/cablesRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// Each tangle is one shot: held for `hold` seconds while the camera turns
// (turntable) or drifts by `orbit` across the clip (montage).
runVideo({
  kernelLabel: 'Cables',
  loadKernel,
  nouns: 'tangles',
  overlay: sceneIconFile('cables'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { cables } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? cables.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      generationAt(kernel, { batch, index, roll })
    );
    const stable = options.mode === 'turntable' || options.orbit !== 0;
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        let bounds = null;
        return {
          enter(capturer) {
            bounds = capturer.load(drawn);
          },
          frame: (capturer, clock) =>
            capturer.capture(
              cables.frameView({
                azimuthOffset: azimuthOffset(options, clock),
                bounds,
                options,
                stable,
                view: options.view,
              })
            ),
          frames: Math.max(1, Math.round(options.hold * options.fps)),
        };
      }),
    };
  },
  script: 'cables',
  title: 'cables',
  usageFor,
  withCapturer,
});
