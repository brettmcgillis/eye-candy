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
  // An SVG-only batch needs no GPU at all.
  gpu: ({ formats }) => formats.length > 0,
  async item({
    batch,
    capturer,
    formats,
    index,
    kernel,
    options,
    roll,
    save,
    step,
  }) {
    const { iso, relief } = kernel;
    const aspect = options.width / options.height;
    const drawn = await pieceAt(kernel, { batch, index, roll });
    const { config, image } = drawn;
    const build = await step(`building ${drawn.name}`, () =>
      iso.createIsoBuilder().build(config, {
        aspect,
        image,
        mode: relief.segmentMode(config),
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
    if (formats.length > 0) {
      await out.eachView((view) =>
        out.image(view, () =>
          capturer.capture(
            relief.frameView({ aspect, config, options, view }),
            build
          )
        )
      );
    }
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
