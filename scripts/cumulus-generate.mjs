#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/cumulus/renderOptions.mjs';
import { loadKernel, parseCli, withCapturer } from './lib/cumulusRender.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'Cumulus',
  loadKernel,
  parseCli,
  withCapturer,
  resolveViews,
  usageFor,
  nouns: 'thoughts',
  script: 'cumulus',
  title: 'cumulus',
  overlay: sceneIconFile('cumulus'),
  setup: ({ kernel: { thoughts }, options, typed }) => ({
    batch: options.batch ?? thoughts.randomSeed(),
    roll: thoughts.rollArgs({ options, typed }),
  }),
  async item({
    batch,
    capturer,
    index,
    kernel: { thoughts },
    options,
    roll,
    save,
    step,
  }) {
    const drawn = thoughts.thoughtAt({ batch, index, roll });
    const bounds = await step(
      `loading ${drawn.name}: ${drawn.config.haloType}`,
      () => capturer.load(drawn)
    );
    drawn.config.captureView = thoughts.frameThought({
      bounds,
      config: drawn.config,
      options,
    });
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = thoughts.frameThought({
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
});
