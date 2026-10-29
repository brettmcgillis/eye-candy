#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/subdivisionRelief/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';
import {
  assertPalette,
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  sidecarOf,
  withCapturer,
} from './lib/subdivisionReliefRender.mjs';

runStills({
  doneLabel: 'rendered pieces',
  async item({ capturer, index, kernel, options, roll, save, step }) {
    const { relief } = kernel;
    const drawn = await step(`laying out piece ${index + 1}`, () =>
      pieceAt(kernel, { index, options, roll })
    );
    const out = await save(drawn.name, sidecarOf(drawn, options));
    capturer.load(drawn);
    const grown = {
      grow: drawn.piece.maxDepth + 1,
      motion: relief.motionAt(drawn.config, 0),
    };
    await out.eachView(async (view) => {
      const framing = relief.frameView({
        config: drawn.config,
        options,
        piece: drawn.piece,
        view,
      });
      await out.image(view, () => capturer.capture(framing, grown));
      if (options.svg)
        await out.svg(view, await capturer.svg(framing, options));
    });
  },
  kernelLabel: 'SubdivisionRelief',
  loadKernel,
  nouns: 'pieces',
  overlay: sceneIconFile('subdivision-relief'),
  parseCli,
  progressLabel: 'rendering views',
  resolveViews,
  script: 'subdivision-relief',
  setup({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return { roll: rollArgs(kernel, { options, typed }) };
  },
  title: 'subdivision relief',
  usageFor,
  withCapturer,
});
