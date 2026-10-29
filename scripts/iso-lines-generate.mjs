#!/usr/bin/env node
import { usageFor } from '../src/modules/isoLines/renderOptions.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  withCapturer,
} from './lib/isoLinesRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  doneLabel: 'rendered pieces',
  // An SVG-only batch needs no GPU at all.
  gpu: ({ formats }) => formats.length > 0,
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const { iso, look } = kernel;
    const aspect = options.width / options.height;
    const drawn = await pieceAt(kernel, { batch, index, roll });
    const build = await step(`building ${drawn.name}`, () =>
      look.buildPiece(drawn, options, {
        time: options.stillTime,
        withLines: options.svg,
      })
    );
    const out = await save(drawn.name, {
      ...sidecarFor({ ...drawn, options }),
      stats: {
        grid: [build.nx, build.ny],
        segments: build.segments?.count ?? 0,
      },
    });
    capturer?.load(drawn, options.pixelRatio);
    await out.image('flat', () =>
      step(`rendering ${drawn.name}`, () =>
        capturer.capture(iso.flatView(aspect), build)
      )
    );
    if (options.svg) {
      await out.file('flat.svg', look.planSvg(drawn, build, options));
    }
  },
  kernelLabel: 'IsoLines',
  loadKernel,
  nouns: 'pieces',
  overlay: sceneIconFile('iso-lines'),
  parseCli,
  progressLabel: 'rendering pieces',
  script: 'iso-lines',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.iso.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'iso lines',
  usageFor,
  withCapturer,
});
