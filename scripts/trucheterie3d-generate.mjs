#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  resolveViews,
  usageFor,
} from '../src/modules/trucheterie3d/renderOptions.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  assertPalette,
  encodeFrame,
  fieldAt,
  loadKernel,
  parseCli,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/trucheterie3dRender.mjs';

const KIND = 'still';

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run trucheterie3d:generate -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const views = resolveViews(options.views);
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const outRoot = path.resolve(REPO_ROOT, String(options.out));

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `trucheterie3d stills: ${options.count} fields, ${views.length} views each, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${formats.join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the Trucheterie3D kernel', loadKernel);
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed });
  const baseSeed = options.blobSeed ?? kernel.tubes.randomSeed();
  const progress = createProgress(
    'rendering views',
    options.count * views.length
  );

  await withCapturer(kernel, options, async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const drawn = await progress.stage(`solving field ${index + 1}`, () =>
        fieldAt(kernel, { baseSeed, index, roll })
      );
      const bounds = await progress.stage(`building ${drawn.name}`, () =>
        capturer.load(drawn)
      );
      const dir = path.join(outRoot, drawn.name);

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(sidecarFor({ ...drawn, options }), null, 2)}\n`
      );

      for (let viewIndex = 0; viewIndex < views.length; viewIndex += 1) {
        const view = views[viewIndex];
        await progress.stage(`rendering ${drawn.name}, ${view}`, async () => {
          const frame = await capturer.capture(
            kernel.tubes.frameView({ bounds, options, view })
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
        progress.update(index * views.length + viewIndex + 1);
      }
      progress.log(`saved ${drawn.name}: ${dir}`);
    }
  });
  progress.done('rendered views');
  // Dawn keeps the event loop alive after the renderer is disposed.
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
