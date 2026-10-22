#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/dumpsterFire/renderOptions.mjs';
import {
  fireAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/dumpsterFireRender.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import { finishCapture, readCapture } from './lib/liveCapture.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  gpu: ({ capture }) => !capture,
  kernelLabel: 'DumpsterFire',
  async item(context) {
    if (context.capture) {
      if (context.index === 0) await finishCapture(context);
      return;
    }
    const { batch, capturer, index, kernel, options, roll, save, step } =
      context;
    const drawn = await step(`rolling fire ${index + 1}`, () =>
      fireAt(kernel, { batch, index, roll })
    );
    const { bounds } = await step(
      `burning ${drawn.name} (${drawn.config.smokeSystem}, ${drawn.config.mood})`,
      () => capturer.load(drawn.config, drawn.name)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.fire.frameDumpster({
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
  nouns: 'fires',
  overlay: sceneIconFile('dumpster-fire'),
  parseCli,
  resolveViews,
  script: 'dumpster-fire',
  setup: async ({ kernel, options, typed }) =>
    options.capture
      ? { capture: await readCapture(options.capture) }
      : {
          batch: options.batch ?? kernel.fire.randomSeed(),
          roll: rollArgs(kernel, { options, typed }),
        },
  title: 'dumpsterfire',
  usageFor,
  withCapturer,
});
