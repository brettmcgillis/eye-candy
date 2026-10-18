#!/usr/bin/env node
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

import {
  resolveViews,
  usageFor,
} from '../src/modules/ghostBuster/renderOptions.mjs';
import { REPO_ROOT, runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  ghostAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/ghostBusterRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// A Live-tab capture arrives rendered: the page drew the PNG and the plot
// from the running ghost, and this only finishes it the way any still is
// finished — formats, overlay and sidecar — then drops the upload.
async function finishCapture({ capture, options, save }) {
  const out = await save(
    capture.name,
    sidecarFor({ config: capture.config, name: capture.name, options })
  );
  await out.view('live', async () => {
    await out.image('live', () => readFile(path.join(capture.dir, 'live.png')));
    if (options.svg && capture.svg) {
      await out.svg(
        'live',
        await readFile(path.join(capture.dir, 'live.svg'), 'utf8')
      );
    }
  });
  await rm(capture.dir, { force: true, recursive: true });
}

async function readCapture(folder) {
  const dir = path.resolve(REPO_ROOT, folder);
  const manifest = JSON.parse(
    await readFile(path.join(dir, 'capture.json'), 'utf8')
  );
  return { ...manifest, dir };
}

runStills({
  gpu: ({ capture }) => !capture,
  kernelLabel: 'GhostBuster',
  async item(context) {
    if (context.capture) {
      if (context.index === 0) await finishCapture(context);
      return;
    }
    const { batch, capturer, index, kernel, options, roll, save, step } =
      context;
    const drawn = await step(`rolling ghost ${index + 1}`, () =>
      ghostAt(kernel, { batch, index, roll })
    );
    const { bounds } = await step(
      `settling ${drawn.name} (${drawn.config.skin})`,
      () => capturer.load(drawn.config)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.ghost.frameGhost({
        bounds,
        config: drawn.config,
        options,
        view,
      });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg)
        await out.svg(view, await capturer.svg(framing, options));
    });
  },
  loadKernel,
  nouns: 'ghosts',
  overlay: sceneIconFile('ghost-buster'),
  parseCli,
  resolveViews,
  script: 'ghost-buster',
  setup: async ({ kernel, options, typed }) =>
    options.capture
      ? { capture: await readCapture(options.capture) }
      : {
          batch: options.batch ?? kernel.ghost.randomSeed(),
          roll: rollArgs(kernel, { options, typed }),
        },
  title: 'ghostbuster',
  usageFor,
  withCapturer,
});
