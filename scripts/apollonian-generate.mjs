#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/apollonian/renderOptions.mjs';
import {
  framingFor,
  loadKernel,
  objectAt,
  parseCli,
  plotSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/apollonianRender.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  doneLabel: 'rendered',
  // A plot-only batch needs no GPU at all.
  gpu: ({ formats }) => formats.length > 0,
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling object ${index + 1}`, () =>
      objectAt(kernel, { batch, index, options, roll })
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    if (capturer) {
      await out.eachView((view) =>
        out.image(view, () =>
          capturer.capture(
            drawn.config,
            drawn.stops,
            framingFor(kernel, drawn.config, options, view)
          )
        )
      );
    }
    if (options.svg) {
      await step(`plotting ${drawn.name}`, () =>
        out.file(
          'slice.svg',
          plotSvg(kernel, drawn.config, drawn.stops, options)
        )
      );
    }
  },
  kernelLabel: 'Apollonian',
  loadKernel,
  nouns: 'objects',
  overlay: sceneIconFile('apollonian'),
  parseCli,
  progressLabel: 'rendering',
  resolveViews,
  script: 'apollonian',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.apollonian.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'apollonian',
  usageFor,
  withCapturer,
});
