#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/candle/renderOptions.mjs';
import {
  candleAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/candleRender.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'Candle',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling candle ${index + 1}`, () =>
      candleAt(kernel, { batch, index, roll })
    );
    const { bounds } = await step(
      `burning ${drawn.name} (${drawn.config.flame}, ${drawn.config.smoke})`,
      () => capturer.load(drawn.config, drawn.name, { options })
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.candle.frameCandle({ bounds, options, view });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturer.svg(framing, options));
      }
    });
  },
  loadKernel,
  nouns: 'candles',
  overlay: sceneIconFile('candle'),
  parseCli,
  resolveViews,
  script: 'candle',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.candle.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'candle',
  usageFor,
  withCapturer,
});
