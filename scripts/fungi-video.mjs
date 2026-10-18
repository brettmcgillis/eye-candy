#!/usr/bin/env node
import { usageFor } from '../src/modules/fungi/renderOptions.mjs';
import {
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  specimenAt,
  withCapturer,
} from './lib/fungiRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// Seconds of clip per specimen, and its levels at a clip time. The lifecycle
// clock runs at the specimen's own timeScale, the way the scene does.
function plan(kernel, options, config) {
  const { fungi } = kernel;
  const speed = config.timeScale || 1;
  const { cycleEnd, matured } = fungi.timeline(config);
  const grown = (specimen) => fungi.stillLevels(specimen, { grow: 1, rot: 0 });

  if (options.mode === 'lifecycle') {
    return {
      duration: cycleEnd / speed,
      levels: (seconds) => (specimen) =>
        fungi.specimenLevels(config, specimen, seconds * speed),
    };
  }
  if (options.mode === 'growth') {
    return {
      duration: matured / speed + options.hold,
      levels: (seconds) => (specimen) => {
        const t = Math.min(seconds * speed, matured);
        return {
          ...fungi.specimenLevels(config, specimen, t),
          rot: 0,
          spore: 0,
        };
      },
    };
  }
  return { duration: options.hold, levels: () => grown };
}

runVideo({
  kernelLabel: 'Fungi',
  loadKernel,
  nouns: 'specimens',
  overlay: sceneIconFile('fungi'),
  parseCli,
  plan({ kernel, options, typed }) {
    const roll = rollArgs(kernel, { options, typed });
    const items = Array.from({ length: options.count }, (_, index) => {
      const drawn = specimenAt(kernel, { index, options, roll });
      const { duration, levels } = plan(kernel, options, drawn.config);
      return {
        drawn,
        frames: Math.max(1, Math.round(duration * options.fps)),
        levels,
      };
    });
    return {
      presets: () => items.map(({ drawn }) => drawn.config),
      shots: items.map(({ drawn, frames, levels }) => {
        let bounds = null;
        let still = null;
        return {
          enter(capturer) {
            bounds = capturer.load(drawn);
          },
          async frame(capturer, clock) {
            if (options.mode === 'montage' && still) return still;
            const image = await capturer.capture({
              ...frameView(kernel, {
                azimuthOffset: azimuthOffset(options, clock),
                bounds,
                options,
                view: options.view,
              }),
              levels: levels(clock.seconds),
            });
            still = image.data;
            return still;
          },
          frames,
        };
      }),
    };
  },
  script: 'fungi',
  title: 'fungi',
  usageFor,
  withCapturer,
});
