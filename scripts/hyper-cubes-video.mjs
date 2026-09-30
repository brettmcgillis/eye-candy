#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/hyperCubes/renderOptions.mjs';
import createFrameSink from './lib/frameSink.mjs';
import {
  REPO_ROOT,
  loadKernel,
  parseCli,
  rollArgs,
  structureAt,
  withCapturer,
} from './lib/hyperCubesRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

// A morph clip is one stage: every structure after the first keeps the
// first one's atmosphere, so only the cubes move.
function rollItems(kernel, { batch, options, roll }) {
  const { cubes } = kernel;
  const items = Array.from({ length: options.count }, (_, index) =>
    structureAt(kernel, { batch, index, roll })
  );
  if (options.mode !== 'morph') return items;
  const held = Object.fromEntries(
    cubes.keysInFacet('atmosphere').map((key) => [key, items[0].config[key]])
  );
  return items.map((item, index) =>
    index === 0 ? item : { ...item, config: { ...item.config, ...held } }
  );
}

// Each clip is a list of shots: a structure loaded for `frames` frames, and
// what those frames draw.
function planShots(kernel, items, options) {
  const { cubes } = kernel;
  const { fps } = options;
  if (options.mode === 'morph') {
    const clock = { ...items[0].config, holdSeconds: options.hold };
    const frames = Math.max(
      1,
      Math.round(cubes.morphClipSeconds(clock, items.length) * fps)
    );
    return [
      {
        drawn: items[0],
        frames,
        instancesAt: (frame) => {
          const { from, t, to } = cubes.morphAt(
            frame / fps,
            clock,
            items.length
          );
          const a = items[from];
          const b = items[to];
          return cubes.buildInstances({
            config: a.config,
            from: a.tree.root,
            stops: a.stops,
            t,
            to: b.tree.root,
            toConfig: b.config,
            toStops: b.stops,
          });
        },
      },
    ];
  }
  return items.map((drawn) => {
    if (options.mode === 'turntable') {
      return {
        drawn,
        frames: Math.max(1, Math.round(options.hold * fps)),
        instancesAt: () => null,
      };
    }
    const depth = cubes.treeDepth(drawn.tree.root);
    const grow = depth * drawn.config.growLevelSeconds;
    return {
      drawn,
      frames: Math.max(1, Math.round((grow + options.hold) * fps)),
      instancesAt: (frame) =>
        cubes.buildInstances({
          config: drawn.config,
          from: drawn.tree.root,
          grow: cubes.growAt(frame / fps, drawn.config, depth, { loop: false }),
          stops: drawn.stops,
        }),
    };
  });
}

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run hyper-cubes:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `hypercubes video: mode ${options.mode}, ${options.count} structures, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the HyperCubes kernel', loadKernel);
  const { cubes } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? cubes.randomSeed();
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
        const { drawn, frames, instancesAt } = shots[s];
        const loaded = capturer.load(drawn);
        const bounds =
          options.mode === 'morph'
            ? items
                .map(({ config }) => cubes.domainBounds(config))
                .reduce(
                  (all, b) => ({
                    max: all.max.map((v, a) => Math.max(v, b.max[a])),
                    min: all.min.map((v, a) => Math.min(v, b.min[a])),
                  }),
                  loaded
                )
            : loaded;
        for (let frame = 0; frame < frames; frame += 1) {
          const azimuthOffset =
            options.mode === 'turntable'
              ? (360 * options.turns * frame) / frames
              : (options.orbit * written) / total;
          const image = await capturer.capture(
            cubes.frameView({
              azimuthOffset,
              bounds,
              options,
              stable: options.mode === 'turntable' || options.orbit !== 0,
              view: options.view,
            }),
            instancesAt(frame)
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
