#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/brutalist/renderOptions.mjs';
import {
  loadKernel,
  parseCli,
  rollArgs,
  structureAt,
  withCapturer,
} from './lib/brutalistRender.mjs';
import { capturerSvg, runStills, sidecarFor } from './lib/generatorCli.mjs';

runStills({
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling structure ${index + 1}`, () =>
      structureAt(kernel, { batch, index, roll })
    );
    await step(`building ${drawn.name}`, () => capturer.load(drawn));
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = capturer.frame(options, view);
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  kernelLabel: 'Brutalist',
  loadKernel,
  nouns: (options) => `structures (${options.stage})`,
  parseCli,
  resolveViews,
  script: 'brutalist',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.brutalist.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'brutalist',
  usageFor,
  withCapturer,
});
