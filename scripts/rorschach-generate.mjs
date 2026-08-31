#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
  resolveIgPreset,
  resolveViews,
  usageFor,
} from '../src/modules/rorschach/renderOptions.mjs';
import {
  parseArgs,
  providedKeys,
  readJsonFlags,
  readPackageVersion,
} from './lib/cliArgs.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  buildTest,
  disposeCapturers,
  frameSvg,
  loadKernel,
  renderFrame,
  rollArgs,
} from './lib/rorschachRender.mjs';

const DEFAULTS = defaultsFor('still');

function usage() {
  process.stdout.write(
    `Usage: npm run rorschach:generate -- [options]\n${usageFor('still')}`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2), DEFAULTS);
  if (args.help) {
    usage();
    return;
  }

  const validated = normalizeOptions(
    'still',
    await readJsonFlags(args, RENDER_OPTIONS)
  );
  // Read off the raw args, not the validated bag: normalizeOptions merges
  // defaults in, which destroys exactly the distinction being recovered here.
  const typed = providedKeys(args);
  const views = resolveViews(validated.views);
  const options = {
    ...validated,
    ig: resolveIgPreset(validated.ig),
    version: await readPackageVersion(),
  };
  const outRoot = path.resolve(REPO_ROOT, String(options.out));
  const formats = ['png', 'svg', 'webp'].filter((format) => options[format]);

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `rorschach stills: ${options.count} tests, ${views.length} views each, ` +
      `${options.width}x${options.height}, renderer ${options.renderer}, ` +
      `formats ${formats.join('+')}, overlay ${options.overlay ? 'on' : 'off'}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the Rorschach kernel', loadKernel);
  // Validated here rather than as schema `choices`: renderOptions.mjs has to
  // stay import-free, and the gradient names live in gradients.json.
  if (typed.has('palette') && !kernel.PALETTE_NAMES.includes(options.palette)) {
    // Named, not enumerated: there are several hundred gradients and printing
    // the lot buries the error that prompted it.
    throw new Error(
      `unknown palette "${options.palette}". ${kernel.PALETTE_NAMES.length} names are available in src/utils/gradients.json, plus "Random".`
    );
  }
  const roll = rollArgs(kernel, { options, typed });
  const progress = createProgress(
    'rendering views',
    options.count * views.length
  );

  try {
    for (let index = 0; index < options.count; index += 1) {
      const seed =
        typeof options.seed === 'number'
          ? options.seed + index
          : kernel.randomSeed();
      progress.log(
        `test ${index + 1}/${options.count}: generating seed ${seed}`
      );
      // Anything typed on the command line is a pin; everything else is left
      // to the dice. One rule, so `--count 100` is a hundred random tests and
      // `--count 100 --inkPatternWash 1` is a hundred random tests that all
      // share a wash — no separate syntax for either.
      const config = kernel.rollTestConfig(seed, roll);
      const test = buildTest(kernel, config, options);
      const dir = path.join(outRoot, String(seed));

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify({ preset: config, render: options }, null, 2)}\n`
      );

      await views.reduce(async (previous, view, viewIndex) => {
        await previous;
        await progress.stage(
          `rendering test ${seed}, ${view} view`,
          async () => {
            if (options.svg) {
              await writeFile(
                path.join(dir, `${view}.svg`),
                frameSvg(kernel, {
                  bloomEnabled: options.bloom,
                  config,
                  options,
                  test,
                  view,
                })
              );
            }

            if (options.png || options.webp) {
              const raster = await renderFrame(kernel, {
                config,
                options,
                test,
                view,
              });
              if (options.png) {
                await writeFile(path.join(dir, `${view}.png`), raster);
              }
              if (options.webp) {
                await writeFile(
                  path.join(dir, `${view}.webp`),
                  await sharp(raster).webp({ lossless: true }).toBuffer()
                );
              }
            }
          }
        );
        progress.update(index * views.length + viewIndex + 1);
      }, Promise.resolve());

      progress.log(`saved test ${seed}: ${dir}`);
    }

    progress.done('rendered views');
  } finally {
    await disposeCapturers();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
