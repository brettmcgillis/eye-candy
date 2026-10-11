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

runStills({
  doneLabel: 'rendered pieces',
  // An SVG-only batch needs no GPU at all.
  gpu: ({ formats }) => formats.length > 0,
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const { iso } = kernel;
    const aspect = options.width / options.height;
    const drawn = await pieceAt(kernel, { batch, index, roll });
    const { config, image } = drawn;
    const build = await step(`building ${drawn.name}`, () =>
      iso.createIsoBuilder().build(config, {
        aspect,
        image,
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
      await out.file(
        'plan.svg',
        iso.renderIsoSvg({
          aspect,
          config,
          height: options.height,
          lines: build.lines,
          minLength: options.svgMinLength,
          pens: options.svgPens,
          stops: drawn.stops,
          stroke: options.svgStroke,
          width: options.width,
        })
      );
    }
  },
  kernelLabel: 'IsoLines',
  loadKernel,
  nouns: 'pieces',
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
