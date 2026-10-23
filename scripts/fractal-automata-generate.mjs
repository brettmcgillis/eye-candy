#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/fractalAutomata/renderOptions.mjs';
import {
  loadKernel,
  parseCli,
  rollArgs,
  settleStructure,
  sidecarFor,
  withCapturer,
} from './lib/fractalAutomataRender.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const { drawn, loaded } = await step(`growing structure ${index + 1}`, () =>
      settleStructure(capturer, kernel, { batch, index, roll })
    );
    const stats = { occupied: loaded.occupied, seedUsed: loaded.seed };
    const out = await save(
      drawn.name,
      sidecarFor({ ...drawn, options, stats })
    );
    await out.eachView(async (view) => {
      const framed = kernel.look.frameView({
        bounds: loaded.bounds,
        options,
        view,
      });
      await out.image(view, () => capturer.capture(framed));
      if (options.svg) await out.svg(view, await capturer.svg(framed, options));
    });
  },
  kernelLabel: 'Fractal Automata',
  loadKernel,
  nouns: 'structures',
  overlay: sceneIconFile('fractal-automata'),
  parseCli,
  resolveViews,
  script: 'fractal-automata',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.auto.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'fractal automata',
  usageFor,
  withCapturer,
});
