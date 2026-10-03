#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/rugPull/renderOptions.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  cartoonFrame,
  drape,
  encodeFrame,
  loadKernel,
  parseCli,
  rollArgs,
  rugAt,
  sidecarFor,
  viewsOf,
  withCapturer,
} from './lib/rugPullRender.mjs';

const KIND = 'still';
const GPU_VIEWS = ['flat', 'floor', 'wall'];

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run rug-pull:generate -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const views = viewsOf(options);
  const gpuViews = formats.length
    ? views.filter((v) => GPU_VIEWS.includes(v))
    : [];
  const outRoot = path.resolve(REPO_ROOT, String(options.out));
  const aspect = options.width / options.height;

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `rug pull: ${options.count} rugs, views ${views.join('+')}, ` +
      `formats ${[...formats, options.svg ? 'svg' : null].filter(Boolean).join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the Rug Pull kernel', loadKernel);
  const { rug } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? rug.randomSeed();
  const progress = createProgress('weaving rugs', options.count);

  const work = async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const woven = await progress.stage('weaving', () =>
        rugAt(kernel, { batch, index, roll })
      );
      const { build, config, name } = woven;
      const dir = path.join(outRoot, name);
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(sidecarFor({ ...woven, options }), null, 2)}\n`
      );

      if (views.includes('cartoon') && formats.length) {
        const frame = cartoonFrame(kernel, build, options);
        await Promise.all(
          formats.map(async (format) =>
            writeFile(
              path.join(dir, `cartoon.${format}`),
              await encodeFrame(frame, format)
            )
          )
        );
      }
      if (options.svg) {
        await writeFile(
          path.join(dir, 'cartoon.svg'),
          rug.renderRugSvg(build, { scale: options.cartoonScale })
        );
      }

      if (capturer) capturer.load(woven);
      for (let v = 0; v < gpuViews.length; v += 1) {
        const mode = gpuViews[v];
        await progress.stage(`rendering ${name} ${mode}`, async () => {
          const draped = drape(kernel, woven, mode, options.settleSteps);
          const viewOptions = { ...config, rodHeight: draped.rodHeight };
          const makeView = {
            flat: rug.flatView,
            floor: rug.floorView,
            wall: rug.wallView,
          }[mode];
          const frame = await capturer.capture(
            makeView(build, viewOptions, aspect),
            draped,
            {
              config,
              mode,
            }
          );
          await Promise.all(
            formats.map(async (format) =>
              writeFile(
                path.join(dir, `${mode}.${format}`),
                await encodeFrame(frame, format)
              )
            )
          );
        });
      }
      progress.update(index + 1);
      progress.log(
        `saved ${name} (${config.design}, ${config.palette}): ${dir}`
      );
    }
  };

  // A cartoon-only batch needs no GPU at all.
  if (gpuViews.length > 0) await withCapturer(kernel, options, work);
  else await work(null);
  progress.done('wove rugs');
  // Dawn keeps the event loop alive after the renderer is disposed.
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
