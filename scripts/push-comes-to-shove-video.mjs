#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/pushComesToShove/renderOptions.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  loadKernel,
  panelAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/pushComesToShoveRender.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

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

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run push-comes-to-shove:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `push comes to shove video: mode ${options.mode}, ${options.count} panels, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage(
    'loading the Push Comes to Shove kernel',
    loadKernel
  );
  const { shove } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? shove.randomSeed();
  const items = Array.from({ length: options.count }, (_, index) =>
    panelAt(kernel, { batch, index, options, roll })
  );
  const { fadeFrames, holdFrames, simFrames } = shove.planClip(options);
  const progress = createProgress('rendering frames', items.length * simFrames);
  const sink = createFrameSink({
    fps: options.fps,
    height: options.height * options.pixelRatio,
    out,
    width: options.width * options.pixelRatio,
  });
  const spoolDir = await mkdtemp(`${out}.frames-`);
  const head = createSpool(spoolDir, 'head');
  const tails = [
    createSpool(spoolDir, 'tail-a'),
    createSpool(spoolDir, 'tail-b'),
  ];
  const fade = (frame) => shove.crossfadeWeight(frame, fadeFrames);

  let rendered = 0;
  try {
    await withCapturer(kernel, options, async (capturer) => {
      for (let index = 0; index < items.length; index += 1) {
        const drawn = items[index];
        const layout = capturer.load(drawn);
        await progress.stage(`settling ${drawn.name}`, () =>
          capturer.warm(options.warmup)
        );
        const tail = tails[index % 2];
        const previous = tails[(index + 1) % 2];
        for (let frame = 0; frame < simFrames; frame += 1) {
          if (frame > 0) capturer.step(1 / options.fps);
          const image = await capturer.capture(
            shove.frameView({
              azimuthOffset: shove.swayAt(frame, holdFrames, options.sway),
              layout,
              options,
              view: options.view,
            })
          );
          const { data } = image;
          if (frame >= holdFrames) {
            await tail.write(frame - holdFrames, data);
          } else if (frame < fadeFrames && index === 0) {
            await head.write(frame, data);
          } else if (frame < fadeFrames) {
            await sink.write(
              blend(await previous.read(frame), data, fade(frame))
            );
          } else {
            await sink.write(data);
          }
          rendered += 1;
          progress.update(rendered);
        }
      }
      const last = tails[(items.length - 1) % 2];
      for (let frame = 0; frame < fadeFrames; frame += 1) {
        await sink.write(
          blend(await last.read(frame), await head.read(frame), fade(frame))
        );
      }
    });
  } finally {
    await runStage('finishing encode', () => sink.finish());
    await rm(spoolDir, { force: true, recursive: true });
  }
  progress.done('rendered frames');

  const metadataPath = await writeVideoSidecar(out, {
    presets: items.map(({ config }) => config),
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
