#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { resolveViews, usageFor } from '../src/modules/flora/renderOptions.mjs';
import {
  REPO_ROOT,
  assertPalette,
  buildFlowers,
  encodeFrame,
  flowersAt,
  frameView,
  loadKernel,
  parseCli,
  renderSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/floraRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';

const KIND = 'still';

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run flora:generate -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const views = resolveViews(options.views);
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const labels = [...formats, options.svg ? 'svg' : null].filter(Boolean);
  const outRoot = path.resolve(REPO_ROOT, String(options.out));
  const unit =
    options.bouquetSize > 0 || options.bouquet ? 'bouquets' : 'flowers';

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `flora stills: ${options.count} ${unit}, ${views.length} views each, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${labels.join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the Flora kernel', loadKernel);
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed });
  const progress = createProgress(
    'rendering views',
    options.count * views.length
  );

  await withCapturer(kernel, options, async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const drawn = flowersAt(kernel, { index, options, roll });
      const label = drawn.bouquet ? `bouquet-${drawn.seed}` : drawn.seed;
      const flowers = await progress.stage(
        `growing ${label} (${drawn.configs.length} specimen${drawn.configs.length === 1 ? '' : 's'})`,
        async () => buildFlowers(kernel, { ...drawn, options })
      );
      const bounds = capturer.setFlowers(flowers);
      const dir = path.join(outRoot, label);

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(sidecarFor({ ...drawn, options }), null, 2)}\n`
      );

      for (let viewIndex = 0; viewIndex < views.length; viewIndex += 1) {
        const view = views[viewIndex];
        await progress.stage(`rendering ${label}, ${view} view`, async () => {
          const framing = frameView(kernel, { bounds, options, view });
          if (formats.length > 0) {
            const frame = await capturer.capture({
              ...framing,
              levels: () => ({
                bloom: options.bloom,
                exit: 0,
                growth: options.growth,
              }),
            });
            await Promise.all(
              formats.map(async (format) =>
                writeFile(
                  path.join(dir, `${view}.${format}`),
                  await encodeFrame(frame, format)
                )
              )
            );
          }
          if (options.svg) {
            await writeFile(
              path.join(dir, `${view}.svg`),
              await renderSvg(kernel, capturer, {
                flowers,
                options,
                view: framing,
              })
            );
          }
        });
        progress.update(index * views.length + viewIndex + 1);
      }
      progress.log(`saved ${label}: ${dir}`);
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
