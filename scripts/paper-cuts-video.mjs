#!/usr/bin/env node
import { usageFor } from '../src/modules/paperCuts/renderOptions.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/paperCutsRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runVideo({
  kernelLabel: 'PaperCuts',
  loadKernel,
  parseCli,
  withCapturer,
  usageFor,
  script: 'paper-cuts',
  title: 'paper cuts',
  nouns: 'compositions',
  overlay: sceneIconFile('paper-cuts'),
  plan({ kernel, options, typed }) {
    const batch = options.batch ?? kernel.paper.randomSeed();
    const roll = rollArgs(kernel, { options, typed });
    const items = Array.from({ length: options.count }, (_, index) =>
      kernel.look.compositionAt({ batch, index, roll })
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
          frame(capturer, clock) {
            const phase =
              clock.frame / Math.max(1, Math.round(options.hold * options.fps));
            const relief =
              options.mode === 'relief'
                ? (1 - Math.cos(phase * Math.PI * 2)) * 0.12
                : 0;
            return capturer.capture(
              kernel.paper.frameView({
                bounds,
                options,
                view: options.view,
                azimuthOffset: azimuthOffset(options, clock),
              }),
              relief,
              clock.frame / options.fps
            );
          },
        };
      }),
    };
  },
});
