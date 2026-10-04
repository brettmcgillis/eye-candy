#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/trucheterie3d/renderOptions.mjs';
import createFrameSink from './lib/frameSink.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  assertPalette,
  fieldAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/trucheterie3dRender.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

// Each field is one shot: how many frames it holds and what each frame sets
// before it is drawn (the growth reveal, or the palette phase).
function planShot(kernel, drawn, options) {
  const { fps } = options;
  if (options.mode === 'growth') {
    const clock = { ...drawn.config, holdSeconds: options.hold };
    const seconds = kernel.tubes.growClipSeconds(clock);
    return {
      frames: Math.max(1, Math.round(seconds * fps)),
      prepare: (capturer, frame) =>
        capturer.setGrowth(
          kernel.tubes.growAt(frame / fps, clock, { loop: false })
        ),
    };
  }
  if (options.mode === 'flow') {
    return {
      frames: Math.max(1, Math.round(options.hold * fps)),
      prepare: (capturer, frame) =>
        capturer.setPalettePhase(
          (drawn.config.paletteDrift * frame) / options.fps
        ),
    };
  }
  return {
    frames: Math.max(1, Math.round(options.hold * fps)),
    prepare: () => {},
  };
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run trucheterie3d:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `trucheterie3d video: mode ${options.mode}, ${options.count} fields, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the Trucheterie3D kernel', loadKernel);
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed });
  const baseSeed = options.blobSeed ?? kernel.tubes.randomSeed();
  const items = Array.from({ length: options.count }, (_, index) =>
    fieldAt(kernel, { baseSeed, index, roll })
  );
  const shots = items.map((drawn) => ({
    drawn,
    ...planShot(kernel, drawn, options),
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
        const { drawn, frames, prepare } = shots[s];
        const bounds = capturer.load(drawn);
        for (let frame = 0; frame < frames; frame += 1) {
          prepare(capturer, frame);
          const azimuthOffset =
            options.mode === 'turntable'
              ? (360 * options.turns * frame) / frames
              : (options.orbit * written) / total;
          const image = await capturer.capture(
            kernel.tubes.frameView({
              azimuthOffset,
              bounds,
              options,
              stable: options.mode === 'turntable' || options.orbit !== 0,
              view: options.view,
            })
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
    render: { ...options, base: undefined },
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
