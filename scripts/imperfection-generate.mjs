#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/imperfection/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import {
  loadKernel,
  paintingAt,
  parseCli,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/imperfectionRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  doneLabel: 'painted',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling painting ${index + 1}`, () =>
      paintingAt(kernel, { batch, index, options, roll })
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const frame = await capturer.capture(drawn.config, { view });
      await out.image(view, () => frame);
      if (options.svg) {
        await out.svg(
          view,
          kernel.look.renderPaintingSvg({
            ...kernel.look.plotArgs(options),
            image: frame,
          })
        );
      }
    });
  },
  kernelLabel: 'Imperfection',
  loadKernel,
  nouns: 'paintings',
  overlay: sceneIconFile('imperfection'),
  parseCli,
  progressLabel: 'painting',
  resolveViews,
  script: 'imperfection',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.imperfection.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'imperfection',
  usageFor,
  withCapturer,
});
