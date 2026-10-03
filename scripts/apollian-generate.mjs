#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  resolveViews,
  usageFor,
} from '../src/modules/apollian/renderOptions.mjs';
import {
  REPO_ROOT,
  encodeFrame,
  framingFor,
  loadKernel,
  objectAt,
  parseCli,
  plotSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/apollianRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';

const KIND = 'still';

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run apollian:generate -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const views = resolveViews(options.views);
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const labels = [...formats, options.svg ? 'svg' : null].filter(Boolean);
  const outRoot = path.resolve(REPO_ROOT, String(options.out));

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `apollian stills: ${options.count} objects, ${views.length} views each, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${labels.join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the Apollian kernel', loadKernel);
  const { apollian } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? apollian.randomSeed();
  const steps = formats.length > 0 ? views.length : 0;
  const progress = createProgress(
    'rendering',
    options.count * (steps + (options.svg ? 1 : 0))
  );
  let done = 0;

  const run = async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const drawn = await progress.stage(`rolling object ${index + 1}`, () =>
        objectAt(kernel, { batch, index, options, roll })
      );
      const dir = path.join(outRoot, drawn.name);
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(sidecarFor({ ...drawn, options }), null, 2)}\n`
      );

      if (capturer) {
        for (let v = 0; v < views.length; v += 1) {
          const view = views[v];
          await progress.stage(`rendering ${drawn.name}, ${view}`, async () => {
            const frame = await capturer.capture(
              drawn.config,
              drawn.stops,
              framingFor(kernel, drawn.config, options, view)
            );
            await Promise.all(
              formats.map(async (format) =>
                writeFile(
                  path.join(dir, `${view}.${format}`),
                  await encodeFrame(frame, format)
                )
              )
            );
          });
          done += 1;
          progress.update(done);
        }
      }
      if (options.svg) {
        await progress.stage(`plotting ${drawn.name}`, () =>
          writeFile(
            path.join(dir, 'slice.svg'),
            plotSvg(kernel, drawn.config, drawn.stops, options)
          )
        );
        done += 1;
        progress.update(done);
      }
      progress.log(`saved ${drawn.name}: ${dir}`);
    }
  };

  if (formats.length > 0) await withCapturer(kernel, options, run);
  else await run(null);
  progress.done('rendered');
  // Dawn keeps the event loop alive after the renderer is disposed.
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
