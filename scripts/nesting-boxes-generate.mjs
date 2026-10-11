#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/nestingBoxes/renderOptions.mjs';
import { capturerSvg, runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  frameView,
  loadKernel,
  parseCli,
  rollArgs,
  settleBackdrop,
  treeAt,
  withCapturer,
} from './lib/nestingBoxesRender.mjs';

runStills({
  kernelLabel: 'Nesting Boxes',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling tree ${index + 1}`, () =>
      settleBackdrop(capturer, treeAt(kernel, { batch, index, roll }), {
        options,
        roll,
      })
    );
    const bounds = await step(`building ${drawn.name}`, () =>
      capturer.load(drawn)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = frameView({ bounds: bounds.settled, options, view });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  loadKernel,
  nouns: 'trees',
  parseCli,
  resolveViews,
  script: 'nesting-boxes',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.boxes.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'nesting boxes',
  usageFor,
  withCapturer,
});
