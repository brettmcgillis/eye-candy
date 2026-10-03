#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  resolveViews,
  usageFor,
} from '../src/modules/networkTest/renderOptions.mjs';
import {
  REPO_ROOT,
  encodeFrame,
  loadKernel,
  networkAt,
  padFor,
  parseCli,
  rollArgs,
  settledInstances,
  sidecarFor,
  withCapturer,
} from './lib/networkTestRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';

const KIND = 'still';

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run network-test:generate -- [options]\n${usageFor(KIND)}`
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
    `network test stills: ${options.count} networks, ${views.length} views each, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${labels.join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the NetworkTest kernel', loadKernel);
  const { net } = kernel;
  const roll = rollArgs(kernel, { options, typed });
  const batch = options.batch ?? net.randomSeed();
  const progress = createProgress(
    'rendering views',
    options.count * views.length
  );

  const work = async (capturer) => {
    for (let index = 0; index < options.count; index += 1) {
      const drawn = await progress.stage(`building network ${index + 1}`, () =>
        networkAt(kernel, { batch, index, roll })
      );
      capturer?.load(drawn);
      const pad = padFor(drawn);
      const instances = settledInstances(kernel, drawn, options.stillTime);
      const dir = path.join(outRoot, drawn.name);

      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(
          {
            ...sidecarFor({ ...drawn, options }),
            stats: {
              edges: drawn.network.edges.length,
              placements: drawn.network.placements.map(
                ({ family, kind }) => `${family}:${kind}`
              ),
              points: drawn.network.count,
            },
          },
          null,
          2
        )}\n`
      );

      for (let viewIndex = 0; viewIndex < views.length; viewIndex += 1) {
        const view = views[viewIndex];
        await progress.stage(`rendering ${drawn.name}, ${view}`, async () => {
          const framing = net.frameView({
            options,
            pad,
            points: drawn.network.positions,
            view,
          });
          if (formats.length > 0) {
            const frame = await capturer.capture(framing, instances);
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
              net.renderNetworkTestSvg({
                camera: framing,
                config: drawn.config,
                depthPens: options.svgDepthPens,
                height: options.height,
                instances: net.buildInstances({
                  config: drawn.config,
                  network: drawn.network,
                  stops: drawn.stops,
                }),
                minAlpha: options.svgMinAlpha,
                nodes: options.svgNodes,
                stroke: options.svgStroke,
                width: options.width,
              })
            );
          }
        });
        progress.update(index * views.length + viewIndex + 1);
      }
      progress.log(`saved ${drawn.name}: ${dir}`);
    }
  };

  // An SVG-only batch needs no GPU at all.
  if (formats.length > 0) await withCapturer(kernel, options, work);
  else await work(null);
  progress.done('rendered views');
  // Dawn keeps the event loop alive after the renderer is disposed.
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
