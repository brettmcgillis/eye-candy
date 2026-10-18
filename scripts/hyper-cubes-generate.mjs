#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/hyperCubes/renderOptions.mjs';
import { capturerSvg, runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  rollArgs,
  structureAt,
  withCapturer,
} from './lib/hyperCubesRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'HyperCubes',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling structure ${index + 1}`, () =>
      structureAt(kernel, { batch, index, roll })
    );
    const bounds = await step(`building ${drawn.name}`, () =>
      capturer.load(drawn)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.cubes.frameView({ bounds, options, view });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  loadKernel,
  nouns: 'structures',
  overlay: sceneIconFile('hyper-cubes'),
  parseCli,
  resolveViews,
  script: 'hyper-cubes',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.cubes.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'hypercubes',
  usageFor,
  withCapturer,
});
