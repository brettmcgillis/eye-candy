#!/usr/bin/env node
import { usageFor } from '../src/modules/rabbit/renderOptions.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  rabbitAt,
  rollArgs,
  withCapturer,
} from './lib/rabbitRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// One shot per rabbit: the clip plays into his moment, then on for `hold`
// seconds while the camera holds, drifts or (turntable) circles him;
// `montage` holds one still per rabbit.
runVideo({
  kernelLabel: 'Rabbit',
  loadKernel,
  nouns: 'rabbits',
  overlay: sceneIconFile('rabbit'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { rabbit } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? rabbit.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      rabbitAt(kernel, { batch, index, roll })
    );
    const montage = options.mode === 'montage';
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        let settled = null;
        let held = null;
        return {
          async enter(capturer) {
            held = null;
            settled = await capturer.load(drawn.config);
          },
          async frame(capturer, clock) {
            if (montage && held) return held;
            const image = await capturer.capture(
              rabbit.frameRabbit({
                azimuthOffset: azimuthOffset(options, clock),
                bounds: settled.bounds,
                config: drawn.config,
                options,
                view: options.view,
              }),
              montage
                ? settled.start
                : settled.start + clock.frame / options.fps
            );
            if (montage) held = image;
            return image;
          },
          frames: Math.max(1, Math.round(options.hold * options.fps)),
        };
      }),
    };
  },
  script: 'rabbit',
  title: 'rabbit',
  usageFor,
  withCapturer,
});
