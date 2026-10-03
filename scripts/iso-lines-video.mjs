#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/isoLines/renderOptions.mjs';
import createFrameSink from './lib/frameSink.mjs';
import {
  REPO_ROOT,
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  withCapturer,
} from './lib/isoLinesRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

// Each piece is one shot of the field flowing for `hold` seconds, on a
// fixed clock.
function planShot(kernel, drawn, options, aspect) {
  const { config, image } = drawn;
  const builder = kernel.iso.createIsoBuilder();
  return {
    frames: Math.max(1, Math.round(options.hold * options.fps)),
    step: (frame) =>
      builder.build(config, { aspect, image, time: frame / options.fps }),
  };
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run iso-lines:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  const aspect = options.width / options.height;
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `iso lines video: mode ${options.mode}, ${options.count} pieces, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the IsoLines kernel', loadKernel);
  const { iso } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? iso.randomSeed();
  const items = await runStage(`rolling ${options.count} pieces`, () =>
    Promise.all(
      Array.from({ length: options.count }, (_, index) =>
        pieceAt(kernel, { batch, index, roll })
      )
    )
  );
  const shots = items.map((drawn) => ({
    drawn,
    ...planShot(kernel, drawn, options, aspect),
  }));
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
        const { drawn, frames, step } = shots[s];
        capturer.load(drawn, options.pixelRatio);
        for (let frame = 0; frame < frames; frame += 1) {
          const image = await capturer.capture(
            iso.flatView(aspect),
            step(frame)
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
