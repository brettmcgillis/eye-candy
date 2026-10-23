#!/usr/bin/env node
import { resolveViews, usageFor } from '../src/modules/fungi/renderOptions.mjs';
import {
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  sidecarFor,
  specimenAt,
  withCapturer,
} from './lib/fungiRender.mjs';
import { capturerSvg, runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  async item({ capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`growing specimen ${index + 1}`, async () =>
      specimenAt(kernel, { index, options, roll })
    );
    const bounds = capturer.load(drawn);
    const out = await save(drawn.seed, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = {
        ...frameView(kernel, { bounds, options, view }),
        levels: kernel.look.stillLevelsFor(options),
      };
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  kernelLabel: 'Fungi',
  loadKernel,
  nouns: 'specimens',
  overlay: sceneIconFile('fungi'),
  parseCli,
  resolveViews,
  script: 'fungi',
  setup: ({ kernel, options, typed }) => ({
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'fungi',
  usageFor,
  withCapturer,
});
