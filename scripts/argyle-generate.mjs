#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/argyle/renderOptions.mjs';
import { loadKernel, parseCli, withCapturer } from './lib/argyleRender.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'Argyle',
  gpu: ({ options }) => options.webp,
  loadKernel,
  parseCli,
  resolveViews,
  withCapturer,
  usageFor,
  nouns: 'patterns',
  overlay: sceneIconFile('argyle'),
  script: 'argyle',
  title: 'argyle',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.kernel.randomSeed(),
    roll: kernel.kernel.rollArgs({ options, typed }),
  }),
  async item({ batch, capturer, index, kernel, options, roll, save }) {
    const drawn = kernel.kernel.patternAt({ batch, index, roll });
    const field = capturer ? null : kernel.kernel.createField(drawn.config);
    const bounds = capturer ? capturer.load(drawn) : field.bounds;
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.kernel.frameView({ bounds, options, view });
      await out.image(view, () => capturer.capture(framing, 0));
      if (options.svg)
        await out.svg(
          view,
          capturer
            ? capturer.svg(framing, options)
            : kernel.kernel.renderSvg(field, framing, options)
        );
    });
  },
});
