#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/ghostBuster/renderOptions.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  ghostAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/ghostBusterRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'GhostBuster',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`rolling ghost ${index + 1}`, () =>
      ghostAt(kernel, { batch, index, roll })
    );
    const { bounds } = await step(
      `settling ${drawn.name} (${drawn.config.skin})`,
      () => capturer.load(drawn.config)
    );
    const out = await save(drawn.name, sidecarFor({ ...drawn, options }));
    await out.eachView(async (view) => {
      const framing = kernel.ghost.frameGhost({
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
  nouns: 'ghosts',
  overlay: sceneIconFile('ghost-buster'),
  parseCli,
  resolveViews,
  script: 'ghost-buster',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.ghost.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'ghostbuster',
  usageFor,
  withCapturer,
});
