#!/usr/bin/env node
import { usageFor } from '../src/modules/trucheterieBlob/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';
import {
  assertPalette,
  fieldAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/trucheterieBlobRender.mjs';

// A touch past 1 so the last cell the front reaches clears blobShader.js's
// GROWTH_AA falloff and reads as fully drawn.
const FULLY_GROWN = 1.05;
// A grown field recedes at twice its growth speed before the next one starts.
const RECEDE = 0.5;

const easeInOut = (t) => t * t * (3 - 2 * t);

// Seconds on screen per field, and the growth dial at a given second.
function timeline(mode, options) {
  if (mode === 'growth') {
    const grow = options.growSeconds;
    const recede = grow * RECEDE;
    return {
      growthAt(seconds) {
        if (seconds < grow) return FULLY_GROWN * easeInOut(seconds / grow);
        const receding = seconds - grow - options.hold;
        if (receding <= 0) return FULLY_GROWN;
        return FULLY_GROWN * easeInOut(Math.max(0, 1 - receding / recede));
      },
      seconds: grow + options.hold + recede,
    };
  }
  return { growthAt: () => FULLY_GROWN, seconds: options.hold };
}

runVideo({
  kernelLabel: 'Trucheterie blob-field',
  loadKernel,
  nouns: 'fields',
  overlay: sceneIconFile('trucheterie'),
  parseCli,
  plan({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    const roll = rollArgs(kernel, { options, typed });
    const animated = options.mode !== 'montage';
    const clip = timeline(options.mode, options);
    const frames = Math.max(1, Math.round(clip.seconds * options.fps));
    const items = Array.from({ length: options.count }, (_, index) => {
      const drawn = fieldAt(kernel, { index, options, roll });
      if (options.mode === 'stream') drawn.config.blobLaneMode = 'Spectrum';
      return drawn;
    });
    return {
      presets: () => items.map((drawn) => drawn.config),
      shots: items.map((drawn) => {
        let bounds = null;
        let still = null;
        return {
          async enter(capturer, { progress }) {
            bounds = await progress.stage(
              `laying out ${drawn.seed}`,
              async () => capturer.setField(drawn.config)
            );
          },
          exit: ({ progress }) =>
            progress.log(`rendered ${drawn.seed} (${frames} frames)`),
          async frame(capturer, { seconds }) {
            if (!animated && still) return still;
            if (animated) {
              capturer.setGrowth(clip.growthAt(seconds));
              capturer.setPalettePhase(seconds * options.paletteDrift);
            }
            const image = await capturer.capture({
              backgroundColor: drawn.config.sceneBgColor,
              bounds,
              margin: options.margin,
              transparentBackground: options.transparentBackground,
            });
            still = image.data;
            return still;
          },
          frames,
        };
      }),
    };
  },
  script: 'trucheterie',
  title: 'trucheterie',
  usageFor,
  withCapturer,
});
