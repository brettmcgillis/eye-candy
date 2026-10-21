#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/birdsArentReal/renderOptions.mjs';
import {
  flockAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/birdsArentRealRender.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import { finishCapture, readCapture } from './lib/liveCapture.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  gpu: ({ capture }) => !capture,
  kernelLabel: 'BirdsArentReal',
  async item(context) {
    if (context.capture) {
      if (context.index === 0) await finishCapture(context);
      return;
    }
    const { batch, capturer, index, kernel, options, roll, save, step } =
      context;
    const drawn = await step(`rolling flock ${index + 1}`, () =>
      flockAt(kernel, { batch, index, roll })
    );
    const { bounds } = await step(
      `settling ${drawn.name} (${drawn.config.birdCount} × ${drawn.config.arrangement})`,
      () => capturer.load(drawn.config, options)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.birds.frameFlock({
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
  nouns: 'flocks',
  overlay: sceneIconFile('birds-arent-real'),
  parseCli,
  resolveViews,
  script: 'birds-arent-real',
  setup: async ({ kernel, options, typed }) =>
    options.capture
      ? { capture: await readCapture(options.capture) }
      : {
          batch: options.batch ?? kernel.birds.randomSeed(),
          roll: rollArgs(kernel, { options, typed }),
        },
  title: 'birdsarentreal',
  usageFor,
  withCapturer,
});
