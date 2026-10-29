#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/paperCuts/renderOptions.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/paperCutsRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'PaperCuts',
  loadKernel,
  parseCli,
  withCapturer,
  resolveViews,
  usageFor,
  script: 'paper-cuts',
  title: 'paper cuts',
  nouns: 'compositions',
  overlay: sceneIconFile('paper-cuts'),
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.paper.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  async item({ batch, capturer, index, kernel, options, roll, save }) {
    const drawn = kernel.look.compositionAt({ batch, index, roll });
    const bounds = capturer ? await capturer.load(drawn) : null;
    const out = await save(
      drawn.name,
      sidecarFor({
        ...drawn,
        frame: undefined,
        stats: drawn.frame.stats,
        options,
      })
    );
    await out.eachView(async (view) => {
      const layout = bounds ?? { min: [-5, -5, -1], max: [5, 5, 1] };
      const framing = kernel.paper.frameView({ bounds: layout, options, view });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) await out.svg(view, capturer.svg(framing, options));
    });
  },
});
