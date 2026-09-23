#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/trucheterieBlob/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  assertPalette,
  buildField,
  encodeFrame,
  fieldAt,
  loadKernel,
  parseCli,
  renderSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/trucheterieBlobRender.mjs';

const KIND = 'still';

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run trucheterie:generate -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { typed } = parsed;
  const options = { ...parsed.options, version: await readPackageVersion() };
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const outRoot = path.resolve(REPO_ROOT, String(options.out));

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `trucheterie stills: ${options.count} field${options.count === 1 ? '' : 's'}, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${[...formats, options.svg ? 'svg' : null].filter(Boolean).join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage(
    'loading the Trucheterie blob-field kernel',
    loadKernel
  );
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed });
  const progress = createProgress('rendering fields', options.count);

  await withCapturer(kernel, options, async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const drawn = fieldAt(kernel, { index, options, roll });
      const dir = path.join(outRoot, drawn.seed);

      await progress.stage(`rendering ${drawn.seed}`, async () => {
        const bounds = capturer.setField(drawn.config);
        await mkdir(dir, { recursive: true });
        await writeFile(
          path.join(dir, 'props.json'),
          `${JSON.stringify(sidecarFor({ ...drawn, options }), null, 2)}\n`
        );

        const frame = await capturer.capture({
          backgroundColor: drawn.config.sceneBgColor,
          bounds,
          margin: options.margin,
          transparentBackground: options.transparentBackground,
        });
        await Promise.all(
          formats.map(async (format) =>
            writeFile(
              path.join(dir, `field.${format}`),
              await encodeFrame(frame, format, options)
            )
          )
        );
        if (options.svg) {
          const field = buildField(kernel, drawn.config);
          await writeFile(
            path.join(dir, 'field.svg'),
            renderSvg(kernel, field, drawn.config, options)
          );
        }
      });
      progress.update(index + 1);
      progress.log(`saved ${drawn.seed}: ${dir}`);
    }
  });
  progress.done('rendered fields');
  // Dawn keeps the event loop alive after the renderer is disposed.
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
