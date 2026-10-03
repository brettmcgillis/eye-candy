#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/isoLines/renderOptions.mjs';
import {
  REPO_ROOT,
  encodeFrame,
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/isoLinesRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';

const KIND = 'still';

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run iso-lines:generate -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const labels = [...formats, options.svg ? 'svg' : null].filter(Boolean);
  const outRoot = path.resolve(REPO_ROOT, String(options.out));
  const aspect = options.width / options.height;

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `iso lines stills: ${options.count} pieces, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${labels.join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the IsoLines kernel', loadKernel);
  const { iso } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? iso.randomSeed();
  const progress = createProgress('rendering pieces', options.count);

  const work = async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const drawn = await pieceAt(kernel, { batch, index, roll });
      const { config, image } = drawn;
      const build = await progress.stage(`building ${drawn.name}`, () =>
        iso.createIsoBuilder().build(config, {
          aspect,
          image,
          time: options.stillTime,
          withLines: options.svg,
        })
      );
      const dir = path.join(outRoot, drawn.name);
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(
          {
            ...sidecarFor({ ...drawn, options }),
            stats: {
              grid: [build.nx, build.ny],
              segments: build.segments?.count ?? 0,
            },
          },
          null,
          2
        )}\n`
      );

      capturer?.load(drawn, options.pixelRatio);
      if (formats.length > 0) {
        await progress.stage(`rendering ${drawn.name}`, async () => {
          const frame = await capturer.capture(iso.flatView(aspect), build);
          await Promise.all(
            formats.map(async (format) =>
              writeFile(
                path.join(dir, `flat.${format}`),
                await encodeFrame(frame, format)
              )
            )
          );
        });
      }
      if (options.svg) {
        await writeFile(
          path.join(dir, 'plan.svg'),
          iso.renderIsoSvg({
            aspect,
            config,
            height: options.height,
            lines: build.lines,
            minLength: options.svgMinLength,
            pens: options.svgPens,
            stops: drawn.stops,
            stroke: options.svgStroke,
            width: options.width,
          })
        );
      }
      progress.update(index + 1);
      progress.log(`saved ${drawn.name}: ${dir}`);
    }
  };

  // An SVG-only batch needs no GPU at all.
  if (formats.length > 0) await withCapturer(kernel, options, work);
  else await work(null);
  progress.done('rendered pieces');
  // Dawn keeps the event loop alive after the renderer is disposed.
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
