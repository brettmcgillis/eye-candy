#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/exhibitA/renderOptions.mjs';
import {
  exhibitAt,
  loadKernel,
  parseCli,
  rollArgs,
  sidecarFor,
  viewFor,
  withCapturer,
} from './lib/exhibitARender.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  doneLabel: 'rendered',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = exhibitAt(kernel, { batch, index, roll });
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    const layout = await step(`building ${drawn.name}`, async () =>
      capturer.load(drawn)
    );
    await out.eachView((view) =>
      out.image(view, () =>
        capturer.capture(viewFor(kernel, { layout, options, view }))
      )
    );
  },
  kernelLabel: 'ExhibitA',
  loadKernel,
  nouns: 'exhibits',
  overlay: sceneIconFile('exhibit-a'),
  parseCli,
  progressLabel: 'rendering',
  resolveViews,
  script: 'exhibit-a',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.exhibit.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'exhibit-a',
  usageFor,
  withCapturer,
});
