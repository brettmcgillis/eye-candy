#!/usr/bin/env node
import { usageFor } from '../src/modules/brutalist/renderOptions.mjs';
import {
  loadKernel,
  parseCli,
  rollArgs,
  structureAt,
  withCapturer,
} from './lib/brutalistRender.mjs';
import { runVideo } from './lib/generatorCli.mjs';

const DRIFT_FROM = 1.25;
const DRIFT_TO = 0.85;

const ease = (t) => t * t * (3 - 2 * t);

// The camera for one frame. Nothing in the scene moves but the fog, so a
// clip is a camera move over a still structure, with the fog drifting on
// the clip's own clock.
function framingAt(capturer, options, frame, frames) {
  const t = frames > 1 ? frame / (frames - 1) : 0;
  if (options.mode === 'turntable') {
    return capturer.frame(options, options.view, {
      azimuthOffset: 360 * options.turns * t,
      stable: true,
    });
  }
  return capturer.frame(options, options.view, {
    distanceScale: DRIFT_FROM + (DRIFT_TO - DRIFT_FROM) * ease(t),
  });
}

runVideo({
  kernelLabel: 'Brutalist',
  loadKernel,
  nouns: (options) => `structures (${options.stage})`,
  parseCli,
  plan({ kernel, options, typed }) {
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? kernel.brutalist.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      structureAt(kernel, { batch, index, roll })
    );
    const frames = Math.max(1, Math.round(options.hold * options.fps));
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => ({
        enter: (capturer) => capturer.load(drawn),
        frame: (capturer, { frame, seconds }) =>
          capturer.capture(
            framingAt(capturer, options, frame, frames),
            seconds
          ),
        frames,
      })),
    };
  },
  script: 'brutalist',
  title: 'brutalist',
  usageFor,
  withCapturer,
});
