#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/apollian/renderOptions.mjs';
import {
  REPO_ROOT,
  framingFor,
  loadKernel,
  objectAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/apollianRender.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

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
      kernel.apollian
        .keysInFacet('stage')
        .map((key) => [key, first.config[key]])
    );
    return { ...again, config: { ...again.config, ...held } };
  });
}

// Each clip is a list of shots: `frames` frames, each with the config it
// draws and the camera's drift round the object.
function planShots(kernel, items, options) {
  const { apollian } = kernel;
  const { fps } = options;
  if (options.mode === 'morph') {
    const clock = { hold: options.hold, morphSeconds: options.morphSeconds };
    const frames = Math.max(
      1,
      Math.round(apollian.morphClipSeconds(clock, items.length) * fps)
    );
    return [
      {
        configAt: (frame) => {
          const { from, t, to } = apollian.morphAt(
            frame / fps,
            clock,
            items.length
          );
          return apollian.blendConfigs(items[from].config, items[to].config, t);
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
          sliceOffset: apollian.sweepOffset(
            { ...config, sweepSeconds },
            seconds
          ),
        };
      }
      if (options.mode === 'evolve')
        return apollian.evolveConfig(config, seconds);
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

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run apollian:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `apollian video: mode ${options.mode}, view ${options.view}, ` +
      `${options.count} objects, ${options.width}x${options.height} at ` +
      `${options.pixelRatio}x, ${options.fps}fps\noutput: ${out}\n`
  );

  const kernel = await runStage('loading the Apollian kernel', loadKernel);
  const { apollian } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? apollian.randomSeed();
  const items = rollItems(kernel, { batch, options, roll });
  const shots = planShots(kernel, items, options);
  const total = shots.reduce((sum, shot) => sum + shot.frames, 0);
  const progress = createProgress('rendering frames', total);
  const sink = createFrameSink({
    fps: options.fps,
    height: options.height * options.pixelRatio,
    out,
    width: options.width * options.pixelRatio,
  });

  let written = 0;
  try {
    await withCapturer(kernel, options, async (capturer) => {
      for (let s = 0; s < shots.length; s += 1) {
        const { base, configAt, frames, stops } = shots[s];
        for (let frame = 0; frame < frames; frame += 1) {
          const config = configAt(frame);
          const azimuthOffset =
            options.mode === 'turntable'
              ? (360 * options.turns * frame) / frames
              : (options.orbit * written) / total;
          const image = await capturer.capture(
            config,
            stops,
            framingFor(kernel, base, options, options.view, azimuthOffset)
          );
          await sink.write(image.data);
          written += 1;
          progress.update(written);
        }
      }
    });
  } finally {
    await runStage('finishing encode', () => sink.finish());
  }
  progress.done('rendered frames');

  const metadataPath = await writeVideoSidecar(out, {
    presets: items.map(({ config }) => apollian.configFrom(config)),
    render: { ...options, base: undefined, palettes: undefined },
  });
  process.stdout.write(
    `saved video: ${out}\nsaved metadata: ${metadataPath}\n`
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
