#!/usr/bin/env node
import { usageFor } from '../src/modules/apollonian/renderOptions.mjs';
import {
  framingFor,
  loadKernel,
  objectAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/apollonianRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// A morph clip is one stage and one family: every object after the first
// takes the first one's family, packing and stage, so only the form, slice
// and look move.
function rollItems(kernel, { batch, options, roll }) {
  const items = Array.from({ length: options.count }, (_, index) =>
    objectAt(kernel, { batch, index, options, roll })
  );
  if (options.mode !== 'morph') return items;
  const first = items[0];
  const pinned = { ...roll.pinned, family: first.config.family };
  return items.map((item, index) => {
    if (index === 0) return item;
    const again = objectAt(kernel, {
      batch,
      index,
      options,
      roll: { ...roll, pinned },
    });
    const held = Object.fromEntries(
      kernel.apollonian
        .keysInFacet('stage')
        .map((key) => [key, first.config[key]])
    );
    return { ...again, config: { ...again.config, ...held } };
  });
}

// Each clip is a list of shots: `frames` frames, each with the config it
// draws and the camera's drift round the object.
function planShots(kernel, items, options) {
  const { apollonian } = kernel;
  const { fps } = options;
  if (options.mode === 'morph') {
    const clock = { hold: options.hold, morphSeconds: options.morphSeconds };
    const frames = Math.max(
      1,
      Math.round(apollonian.morphClipSeconds(clock, items.length) * fps)
    );
    return [
      {
        configAt: (frame) => {
          const { from, t, to } = apollonian.morphAt(
            frame / fps,
            clock,
            items.length
          );
          return apollonian.blendConfigs(
            items[from].config,
            items[to].config,
            t
          );
        },
        base: items[0].config,
        frames,
        stops: items[0].stops,
      },
    ];
  }
  return items.map((drawn) => {
    const frames = Math.max(1, Math.round(options.hold * fps));
    const { config } = drawn;
    const configAt = (frame) => {
      const seconds = frame / fps;
      if (options.mode === 'sweep') {
        const sweepSeconds = options.hold;
        return {
          ...config,
          sectionCut: options.view === 'slice' ? config.sectionCut : true,
          sliceOffset: apollonian.sweepOffset(
            { ...config, sweepSeconds },
            seconds
          ),
        };
      }
      if (options.mode === 'evolve')
        return apollonian.evolveConfig(config, seconds);
      if (options.view === 'slice') {
        return {
          ...config,
          sliceAzimuth:
            config.sliceAzimuth + (360 * options.turns * frame) / frames,
        };
      }
      return config;
    };
    return { base: config, configAt, frames, stops: drawn.stops };
  });
}

runVideo({
  kernelLabel: 'Apollonian',
  loadKernel,
  nouns: 'objects',
  overlay: sceneIconFile('apollonian'),
  parseCli,
  plan({ kernel, options, typed }) {
    const { apollonian } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? apollonian.randomSeed();
    const items = rollItems(kernel, { batch, options, roll });
    return {
      presets: () => items.map(({ config }) => apollonian.configFrom(config)),
      shots: planShots(kernel, items, options).map(
        ({ base, configAt, frames, stops }) => ({
          frame: (capturer, clock) =>
            capturer.capture(
              configAt(clock.frame),
              stops,
              framingFor(
                kernel,
                base,
                options,
                options.view,
                azimuthOffset(options, clock)
              )
            ),
          frames,
        })
      ),
    };
  },
  script: 'apollonian',
  title: 'apollonian',
  usageFor,
  withCapturer,
});
