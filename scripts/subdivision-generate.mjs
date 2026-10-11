#!/usr/bin/env node
import { usageFor } from '../src/modules/subdivision/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import { runStills } from './lib/generatorCli.mjs';
import {
  assertPalette,
  buildPieceFor,
  loadKernel,
  parseCli,
  pieceAt,
  plotSvg,
  rasterise,
  rollArgs,
  sidecarFor,
} from './lib/subdivisionRender.mjs';

runStills({
  doneLabel: 'rendered pieces',
  async item({ formats, index, kernel, options, roll, save, step }) {
    const { config, seed } = pieceAt(kernel, { index, options, roll });
    await step(`rendering ${seed}`, async () => {
      const piece = await buildPieceFor(kernel, config, options);
      const out = await save(seed, sidecarFor({ config, options, piece }));
      await Promise.all(
        formats.map(async (format) =>
          out.file(
            `piece.${format}`,
            await rasterise(kernel, piece, config, options, format)
          )
        )
      );
      if (options.svg) {
        await out.file('piece.svg', plotSvg(kernel, piece, config, options));
      }
    });
  },
  kernelLabel: 'Subdivision',
  loadKernel,
  nouns: 'pieces',
  parseCli,
  prepare: async (options) => ({
    ...options,
    version: await readPackageVersion(),
  }),
  progressLabel: 'rendering pieces',
  script: 'subdivision',
  setup({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return { roll: rollArgs(kernel, { options, typed }) };
  },
  title: 'subdivision',
  usageFor,
});
