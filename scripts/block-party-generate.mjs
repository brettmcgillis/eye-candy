#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/blockParty/renderOptions.mjs';
import {
  cityAt,
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/blockPartyRender.mjs';
import { capturerSvg, runStills, sidecarFor } from './lib/generatorCli.mjs';

runStills({
  kernelLabel: 'Block Party',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling city ${index + 1}`, async () =>
      cityAt(kernel, { batch, index, roll })
    );
    const bounds = await step(`building ${drawn.name}`, async () =>
      capturer.load(drawn)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = frameView(kernel, { bounds, options, view });
      await out.image(view, () =>
        capturer.capture(framing, { clock: kernel.city.SETTLED, time: 0 })
      );
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  loadKernel,
  nouns: 'cities',
  parseCli,
  resolveViews,
  script: 'block-party',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.city.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'block party',
  usageFor,
  withCapturer,
});
