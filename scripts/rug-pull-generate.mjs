#!/usr/bin/env node
import { usageFor } from '../src/modules/rugPull/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import {
  cartoonFrame,
  drape,
  loadKernel,
  parseCli,
  rollArgs,
  rugAt,
  sidecarFor,
  viewsOf,
  withCapturer,
} from './lib/rugPullRender.mjs';

const GPU_VIEWS = ['flat', 'floor', 'wall'];

const gpuViewsOf = ({ formats, options }) =>
  formats.length ? viewsOf(options).filter((v) => GPU_VIEWS.includes(v)) : [];

runStills({
  doneLabel: 'wove rugs',
  // A cartoon-only batch needs no GPU at all.
  gpu: (ctx) => gpuViewsOf(ctx).length > 0,
  async item(ctx) {
    const { batch, capturer, index, kernel, options, roll, save, step } = ctx;
    const { rug } = kernel;
    const aspect = options.width / options.height;
    const woven = await step('weaving', () =>
      rugAt(kernel, { batch, index, roll })
    );
    const { build, config, name } = woven;
    const out = await save(name, sidecarFor({ ...woven, options }));
    if (viewsOf(options).includes('cartoon')) {
      await out.image('cartoon', () => cartoonFrame(kernel, build, options));
    }
    if (options.svg) {
      await out.file(
        'cartoon.svg',
        rug.renderRugSvg(build, { scale: options.cartoonScale })
      );
    }
    if (capturer) capturer.load(woven);
    const gpuViews = gpuViewsOf(ctx);
    for (let v = 0; v < gpuViews.length; v += 1) {
      const mode = gpuViews[v];
      // eslint-disable-next-line no-await-in-loop
      await step(`rendering ${name} ${mode}`, () =>
        out.image(mode, () => {
          const draped = drape(kernel, woven, mode, options.settleSteps);
          const makeView = {
            flat: rug.flatView,
            floor: rug.floorView,
            wall: rug.wallView,
          }[mode];
          return capturer.capture(
            makeView(build, { ...config, rodHeight: draped.rodHeight }, aspect),
            draped,
            { config, mode }
          );
        })
      );
    }
  },
  kernelLabel: 'Rug Pull',
  loadKernel,
  nouns: 'rugs',
  parseCli,
  progressLabel: 'weaving rugs',
  script: 'rug-pull',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.rug.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'rug pull',
  usageFor,
  withCapturer,
});
