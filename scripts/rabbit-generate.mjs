#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/rabbit/renderOptions.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  rabbitAt,
  rollArgs,
  withCapturer,
} from './lib/rabbitRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

const volleyOf = ({ arrowCount, volley }) =>
  volley === 'rolled' ? `${arrowCount} arrows` : 'the painting';

runStills({
  kernelLabel: 'Rabbit',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling rabbit ${index + 1}`, () =>
      rabbitAt(kernel, { batch, index, roll })
    );
    const { bounds } = await step(
      `settling ${drawn.name} (${volleyOf(drawn.config)}, t=${drawn.config.poseTime}s)`,
      () => capturer.load(drawn.config)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.rabbit.frameRabbit({
        bounds,
        config: drawn.config,
        options,
        view,
      });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg)
        await out.svg(view, await capturer.svg(framing, options));
    });
  },
  loadKernel,
  nouns: 'rabbits',
  overlay: sceneIconFile('rabbit'),
  parseCli,
  resolveViews,
  script: 'rabbit',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.rabbit.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'rabbit',
  usageFor,
  withCapturer,
});
