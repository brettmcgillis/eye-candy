#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/cables/renderOptions.mjs';
import {
  generationAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/cablesRender.mjs';
import { capturerSvg, runStills, sidecarFor } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'Cables',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`laying tangle ${index + 1}`, () =>
      generationAt(kernel, { batch, index, roll })
    );
    const bounds = await step(`building ${drawn.name}`, () =>
      capturer.load(drawn)
    );
    const out = await save(
      drawn.name,
      sidecarFor({ config: drawn.config, name: drawn.name, options })
    );
    await out.eachView(async (view) => {
      const framing = kernel.cables.frameView({ bounds, options, view });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  loadKernel,
  nouns: 'tangles',
  overlay: sceneIconFile('cables'),
  parseCli,
  resolveViews,
  script: 'cables',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.cables.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'cables',
  usageFor,
  withCapturer,
});
