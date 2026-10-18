#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { usageFor } from '../src/modules/pushComesToShove/renderOptions.mjs';
import { REPO_ROOT, runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  panelAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/pushComesToShoveRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

function blend(a, b, w) {
  const out = Buffer.allocUnsafe(a.length);
  for (let i = 0; i < a.length; i += 1) {
    out[i] = a[i] + (b[i] - a[i]) * w + 0.5;
  }
  return out;
}

// Crossfade frames wait on disk: a fade's worth of raw frames at 2x is
// gigabytes, more than is worth holding in memory.
function createSpool(dir, label) {
  const file = (i) => path.join(dir, `${label}-${i}.rgba`);
  return {
    read: (i) => readFile(file(i)),
    write: (i, data) => writeFile(file(i), data),
  };
}

runVideo({
  kernelLabel: 'Push Comes to Shove',
  loadKernel,
  nouns: 'panels',
  overlay: sceneIconFile('push-comes-to-shove'),
  parseCli,
  async plan({ kernel, options, typed }) {
    const { shove } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? shove.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      panelAt(kernel, { batch, index, options, roll })
    );
    const { fadeFrames, holdFrames, simFrames } = shove.planClip(options);
    const spoolDir = await mkdtemp(
      `${path.resolve(REPO_ROOT, String(options.out))}.frames-`
    );
    const head = createSpool(spoolDir, 'head');
    const tails = [
      createSpool(spoolDir, 'tail-a'),
      createSpool(spoolDir, 'tail-b'),
    ];
    const fade = (frame) => shove.crossfadeWeight(frame, fadeFrames);

    return {
      cleanup: () => rm(spoolDir, { force: true, recursive: true }),
      async finish(write) {
        const last = tails[(items.length - 1) % 2];
        for (let frame = 0; frame < fadeFrames; frame += 1) {
          await write(
            blend(await last.read(frame), await head.read(frame), fade(frame))
          );
        }
      },
      presets: () => items.map(({ config }) => config),
      // Each panel's tail is spooled and crossfaded into the next panel's
      // head; the last tail fades into the first head so the clip loops.
      shots: items.map((drawn, index) => {
        const tail = tails[index % 2];
        const previous = tails[(index + 1) % 2];
        let layout = null;
        return {
          async enter(capturer, { progress }) {
            layout = capturer.load(drawn);
            await progress.stage(`settling ${drawn.name}`, () =>
              capturer.warm(options.warmup)
            );
          },
          async frame(capturer, { frame }) {
            if (frame > 0) capturer.step(1 / options.fps);
            const { data } = await capturer.capture(
              shove.frameView({
                azimuthOffset: shove.swayAt(frame, holdFrames, options.sway),
                layout,
                options,
                view: options.view,
              })
            );
            if (frame >= holdFrames) {
              await tail.write(frame - holdFrames, data);
              return null;
            }
            if (frame < fadeFrames && index === 0) {
              await head.write(frame, data);
              return null;
            }
            if (frame < fadeFrames) {
              return blend(await previous.read(frame), data, fade(frame));
            }
            return data;
          },
          frames: simFrames,
        };
      }),
    };
  },
  script: 'push-comes-to-shove',
  title: 'push comes to shove',
  usageFor,
  withCapturer,
});
