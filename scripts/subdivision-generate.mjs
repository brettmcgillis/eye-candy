#!/usr/bin/env node
import { usageFor } from '../src/modules/subdivision/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';
import {
  assertPalette,
  buildPieceFor,
  fillFrame,
  loadKernel,
  parseCli,
  pieceAt,
  plotSvg,
  rollArgs,
  sidecarFor,
} from './lib/subdivisionRender.mjs';

runStills({
  doneLabel: 'rendered pieces',
  async item({ index, kernel, options, roll, save, step }) {
    const { config, seed } = pieceAt(kernel, { index, options, roll });
    await step(`rendering ${seed}`, async () => {
      const piece = await buildPieceFor(kernel, config, options);
      const out = await save(seed, sidecarFor({ config, options, piece }));
      await out.image('piece', () => fillFrame(kernel, piece, config, options));
      if (options.svg) {
        await out.file('piece.svg', plotSvg(kernel, piece, config, options));
      }
    });
  },
  kernelLabel: 'Subdivision',
  loadKernel,
  nouns: 'pieces',
  overlay: sceneIconFile('subdivision'),
  parseCli,
  progressLabel: 'rendering pieces',
  script: 'subdivision',
  setup({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return { roll: rollArgs(kernel, { options, typed }) };
  },
  title: 'subdivision',
  usageFor,
});
