#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/pushComesToShove/renderOptions.mjs';
import { capturerSvg, runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  loadKernel,
  panelAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/pushComesToShoveRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling panel ${index + 1}`, () =>
      panelAt(kernel, { batch, index, options, roll })
    );
    const layout = await step(`building ${drawn.name}`, () =>
      capturer.load(drawn)
    );
    await step(`settling ${drawn.name}`, () => capturer.warm(options.warmup));
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.shove.frameView({ layout, options, view });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  kernelLabel: 'Push Comes to Shove',
  loadKernel,
  nouns: 'panels',
  overlay: sceneIconFile('push-comes-to-shove'),
  parseCli,
  resolveViews,
  script: 'push-comes-to-shove',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.shove.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'push comes to shove',
  usageFor,
  withCapturer,
});
