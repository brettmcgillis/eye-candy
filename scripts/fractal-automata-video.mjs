#!/usr/bin/env node
import { usageFor } from '../src/modules/fractalAutomata/renderOptions.mjs';
import {
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  settleStructure,
  withCapturer,
} from './lib/fractalAutomataRender.mjs';
import { runVideo } from './lib/generatorCli.mjs';

const TAU = Math.PI * 2;
const GODRAY_ORBIT_SHARE = 0.45;

// The godray light circles at a share of the structure's half-width, at the
// height of its centre, so its beams thread the gaps in the structure.
function godrayOrbit(bounds, turns) {
  const center = bounds.min.map((v, a) => (v + bounds.max[a]) / 2);
  const radius =
    (GODRAY_ORBIT_SHARE *
      (bounds.max[0] - bounds.min[0] + bounds.max[2] - bounds.min[2])) /
    4;
  return (share) => {
    const angle = TAU * turns * share;
    return {
      x: center[0] + Math.cos(angle) * radius,
      y: center[1],
      z: center[2] + Math.sin(angle) * radius,
    };
  };
}

runVideo({
  kernelLabel: 'Fractal Automata',
  loadKernel,
  nouns: 'structures',
  parseCli,
  plan({ kernel, options, typed }) {
    const rolled = rollArgs(kernel, { options, typed });
    const roll =
      options.mode === 'godrayLight'
        ? { ...rolled, pinned: { ...rolled.pinned, godraysEnabled: true } }
        : rolled;
    const batch = options.batch ?? kernel.auto.randomSeed();
    const frames = Math.max(1, Math.round(options.hold * options.fps));
    const settled = [];
    return {
      presets: () => settled,
      shots: Array.from({ length: options.count }, (_, index) => {
        let drawn = null;
        let bounds = null;
        let orbit = null;
        return {
          async enter(capturer, { progress }) {
            const result = await progress.stage(
              `growing structure ${index + 1}`,
              () => settleStructure(capturer, kernel, { batch, index, roll })
            );
            drawn = result.drawn;
            bounds = result.loaded.bounds;
            settled.push(drawn.config);
            orbit = godrayOrbit(bounds, options.turns);
          },
          frame(capturer, { frame }) {
            const share = frame / frames;
            const config =
              options.mode === 'keyLight'
                ? {
                    ...drawn.config,
                    lightAzimuth:
                      (drawn.config.lightAzimuth +
                        360 * options.turns * share) %
                      360,
                  }
                : drawn.config;
            return capturer.capture(
              frameView({
                azimuthOffset:
                  options.mode === 'turntable'
                    ? 360 * options.turns * share
                    : 0,
                bounds,
                options,
                stable: options.mode === 'turntable',
                view: options.view,
              }),
              {
                config,
                position:
                  options.mode === 'godrayLight' ? orbit(share) : undefined,
              }
            );
          },
          frames,
        };
      }),
    };
  },
  script: 'fractal-automata',
  title: 'fractal automata',
  usageFor,
  withCapturer,
});
