#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  resolveViews,
  usageFor,
} from '../src/modules/kumiko/renderOptions.mjs';
import {
  REPO_ROOT,
  encodeImage,
  frameView,
  loadKernel,
  panelAt,
  parseCli,
  renderFlatSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/kumikoRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';

const KIND = 'still';

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run kumiko:generate -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const views = resolveViews(options.views);
  const solid = views.filter((view) => view !== 'flat');
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const outRoot = path.resolve(REPO_ROOT, String(options.out));

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `kumiko stills: ${options.count} panels, views ${views.join('+')}, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${[...formats, options.svg ? `svg(${options.svgStyle})` : null].filter(Boolean).join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the Kumiko kernel', loadKernel);
  const roll = rollArgs(kernel, { options, typed });
  const progress = createProgress('rendering panels', options.count);

  const render = async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const drawn = await progress.stage(
        `building panel ${index + 1}`,
        async () => panelAt(kernel, { index, options, roll })
      );
      const dir = path.join(outRoot, drawn.seed);
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(sidecarFor({ ...drawn, options }), null, 2)}\n`
      );

      if (options.svg) {
        await writeFile(
          path.join(dir, 'panel.svg'),
          renderFlatSvg(kernel, { ...drawn, options }, options.svgStyle)
        );
      }
      if (views.includes('flat') && formats.length > 0) {
        const art = Buffer.from(
          renderFlatSvg(kernel, { ...drawn, options }, 'fill')
        );
        await Promise.all(
          formats.map(async (format) =>
            writeFile(
              path.join(dir, `flat.${format}`),
              await encodeImage(art, format)
            )
          )
        );
      }
      if (capturer && formats.length > 0) {
        const bounds = await progress.stage(`placing ${drawn.seed}`, async () =>
          capturer.load(drawn)
        );
        for (let v = 0; v < solid.length; v += 1) {
          const view = solid[v];
          const frame = await progress.stage(
            `rendering ${drawn.seed}, ${view}`,
            () => capturer.capture(frameView({ bounds, options, view }))
          );
          await Promise.all(
            formats.map(async (format) =>
              writeFile(
                path.join(dir, `${view}.${format}`),
                await encodeImage(frame, format)
              )
            )
          );
        }
      }
      progress.update(index + 1);
      progress.log(`saved ${drawn.seed}: ${dir}`);
    }
  };

  if (solid.length > 0 && formats.length > 0)
    await withCapturer(kernel, options, render);
  else await render(null);
  progress.done('rendered panels');
  // Dawn keeps the event loop alive after the renderer is disposed.
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
