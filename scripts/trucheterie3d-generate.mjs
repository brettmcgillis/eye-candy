#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/trucheterie3d/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';
import {
  assertPalette,
  fieldAt,
  loadKernel,
  parseCli,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/trucheterie3dRender.mjs';

runStills({
  async item({ baseSeed, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`solving field ${index + 1}`, () =>
      fieldAt(kernel, { baseSeed, index, roll })
    );
    const bounds = await step(`building ${drawn.name}`, () =>
      capturer.load(drawn)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView((view) =>
      out.image(view, () =>
        capturer.capture(kernel.tubes.frameView({ bounds, options, view }))
      )
    );
  },
  kernelLabel: 'Trucheterie3D',
  loadKernel,
  nouns: 'fields',
  overlay: sceneIconFile('trucheterie3d'),
  parseCli,
  resolveViews,
  script: 'trucheterie3d',
  setup({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return {
      baseSeed: options.blobSeed ?? kernel.tubes.randomSeed(),
      roll: rollArgs(kernel, { options, typed }),
    };
  },
  title: 'trucheterie3d',
  usageFor,
  withCapturer,
});
