#!/usr/bin/env node
import { resolveViews, usageFor } from '../src/modules/flora/renderOptions.mjs';
import {
  assertPalette,
  buildFlowers,
  flowersAt,
  frameView,
  loadKernel,
  parseCli,
  renderSvg,
  resolveItemOptions,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/floraRender.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  async item({ capturer, index, kernel, options, roll, save, step }) {
    const drawn = flowersAt(kernel, { index, options, roll });
    const itemOptions = resolveItemOptions(kernel, options, drawn.seed);
    const label = drawn.bouquet ? `bouquet-${drawn.seed}` : drawn.seed;
    const count = drawn.configs.length;
    const flowers = await step(
      `growing ${label} (${count} specimen${count === 1 ? '' : 's'})`,
      async () => buildFlowers(kernel, { ...drawn, options: itemOptions })
    );
    const bounds = capturer.setFlowers(flowers);
    const out = await save(
      label,
      sidecarFor({ ...drawn, options: itemOptions })
    );
    await out.eachView(async (view) => {
      const framing = frameView(kernel, { bounds, options, view });
      await out.image(view, () =>
        capturer.capture({
          ...framing,
          levels: () => ({
            bloom: options.bloom,
            exit: 0,
            growth: options.growth,
          }),
        })
      );
      if (options.svg) {
        await out.svg(
          view,
          await renderSvg(kernel, capturer, { flowers, options, view: framing })
        );
      }
    });
  },
  kernelLabel: 'Flora',
  loadKernel,
  nouns: (options) =>
    options.bouquetSize > 0 || options.bouquet ? 'bouquets' : 'flowers',
  overlay: sceneIconFile('flora'),
  parseCli,
  resolveViews,
  script: 'flora',
  setup({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return { roll: rollArgs(kernel, { options, typed }) };
  },
  title: 'flora',
  usageFor,
  withCapturer,
});
