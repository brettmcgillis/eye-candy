#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/isoLinesRelief/renderOptions.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  withCapturer,
} from './lib/isoLinesReliefRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  doneLabel: 'rendered pieces',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const { look, relief } = kernel;
    const aspect = options.width / options.height;
    const drawn = await pieceAt(kernel, { batch, index, roll });
    const { config } = drawn;
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
    capturer.load(drawn, options.pixelRatio);
    capturer.show(build);
    await out.eachView(async (view) => {
      const framing = relief.frameView({ aspect, config, options, view });
      await out.image(view, () => capturer.capture(framing, build));
      if (options.svg)
        await out.svg(view, await capturer.svg(framing, options));
    });
  },
  kernelLabel: 'IsoLinesRelief',
  loadKernel,
  nouns: 'pieces',
  overlay: sceneIconFile('iso-lines-relief'),
  parseCli,
  resolveViews,
  script: 'iso-lines-relief',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.iso.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'iso lines relief',
  usageFor,
  withCapturer,
});
