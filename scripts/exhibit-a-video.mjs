#!/usr/bin/env node
import {
  FAMILIES,
  FAMILY_KINDS,
  usageFor,
} from '../src/modules/exhibitA/renderOptions.mjs';
import {
  exhibitAt,
  loadKernel,
  parseCli,
  rollArgs,
  viewFor,
  withCapturer,
} from './lib/exhibitARender.mjs';
import { runVideo } from './lib/generatorCli.mjs';

// A draw only moves a mesh exhibit; the ray-marched families have nothing to
// build up, so an unpinned draw roll leaves them out.
function rollFor(kernel, parsed) {
  const roll = rollArgs(kernel, parsed);
  if (parsed.options.mode !== 'draw' || parsed.typed.has('families')) {
    return roll;
  }
  return {
    ...roll,
    families: FAMILIES.filter((family) => FAMILY_KINDS[family] !== 'field'),
  };
}

// What a frame draws `seconds` into a clip of `hold` seconds: the config,
// the key light's bearing, the draw progress and the camera's turn. A clip
// is one lap of its motion: a sweep swings once, a draw builds for
// `hold − drawHold` seconds and then holds the finished exhibit.
function frameAt(kernel, { config, frame, frames, options }) {
  const { exhibit } = kernel;
  const seconds = frame / options.fps;
  const turn = frame / frames;
  const camera =
    options.mode === 'turntable'
      ? 360 * options.turns * turn
      : options.orbit * turn;
  const drawSeconds = Math.max(1, options.hold - config.drawHold);
  return {
    azimuthOffset: camera,
    config:
      options.mode === 'evolve' ? exhibit.evolveConfig(config, seconds) : null,
    lightAzimuth:
      options.mode === 'sweep'
        ? exhibit.sweepAzimuth(
            { ...config, sweepSeconds: options.hold },
            seconds
          )
        : config.lightAzimuth,
    progress:
      options.mode === 'draw'
        ? exhibit.drawProgress({ ...config, drawSeconds }, seconds)
        : 1,
  };
}

runVideo({
  kernelLabel: 'ExhibitA',
  loadKernel,
  nouns: 'exhibits',
  parseCli,
  plan({ kernel, options, parsed }) {
    const { exhibit } = kernel;
    const roll = rollFor(kernel, parsed);
    const batch = options.batch ?? exhibit.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      exhibitAt(kernel, { batch, index, roll })
    );
    const frames = Math.max(1, Math.round(options.hold * options.fps));
    return {
      presets: () => items.map(({ config }) => exhibit.configFrom(config)),
      shots: items.map((drawn) => {
        let layout = null;
        return {
          async enter(capturer, { progress }) {
            layout = await progress.stage(`building ${drawn.name}`, async () =>
              capturer.load(drawn)
            );
          },
          frame(capturer, { frame }) {
            const { azimuthOffset, ...shown } = frameAt(kernel, {
              config: drawn.config,
              frame,
              frames,
              options,
            });
            return capturer.capture(
              viewFor(kernel, {
                azimuthOffset,
                layout,
                options,
                view: options.view,
              }),
              shown
            );
          },
          frames,
        };
      }),
    };
  },
  script: 'exhibit-a',
  title: 'exhibit-a',
  usageFor,
  withCapturer,
});
