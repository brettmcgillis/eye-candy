#!/usr/bin/env node
import { usageFor } from '../src/modules/imperfection/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  paintingAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/imperfectionRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// Each painting plays its seamless loop `loops` times, so a clip of one
// painting loops cleanly too.
runVideo({
  kernelLabel: 'Imperfection',
  loadKernel,
  nouns: 'paintings',
  overlay: sceneIconFile('imperfection'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { imperfection } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? imperfection.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      paintingAt(kernel, { batch, index, options, roll })
    );
    return {
      presets: () => items.map(({ config }) => imperfection.configFrom(config)),
      shots: items.map(({ config }) => ({
        frame: (capturer, clock) =>
          capturer.capture(config, { time: clock.frame / options.fps }),
        frames: Math.max(
          1,
          Math.round(config.loopSeconds * options.loops * options.fps)
        ),
      })),
    };
  },
  script: 'imperfection',
  title: 'imperfection',
  usageFor,
  withCapturer,
});
