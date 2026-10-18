#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/kumiko/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import {
  frameView,
  loadKernel,
  panelAt,
  parseCli,
  renderFlatSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/kumikoRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

const solidOf = (views) => views.filter((view) => view !== 'flat');

runStills({
  doneLabel: 'rendered panels',
  // `flat` is the 2D art; only the 3D views need the GPU.
  gpu: ({ formats, views }) => solidOf(views).length > 0 && formats.length > 0,
  async item({ capturer, index, kernel, options, roll, save, step, views }) {
    const drawn = await step(`building panel ${index + 1}`, async () =>
      panelAt(kernel, { index, options, roll })
    );
    const out = await save(drawn.seed, sidecarFor({ ...drawn, options }));
    if (options.svg) {
      await out.file(
        'panel.svg',
        renderFlatSvg(kernel, { ...drawn, options }, options.svgStyle)
      );
    }
    if (views.includes('flat')) {
      await out.image('flat', () =>
        Buffer.from(renderFlatSvg(kernel, { ...drawn, options }, 'fill'))
      );
    }
    if (capturer) {
      const bounds = await step(`placing ${drawn.seed}`, async () =>
        capturer.load(drawn)
      );
      const solid = solidOf(views);
      for (let v = 0; v < solid.length; v += 1) {
        const view = solid[v];
        // eslint-disable-next-line no-await-in-loop
        await out.image(view, () =>
          step(`rendering ${drawn.seed}, ${view}`, () =>
            capturer.capture(frameView({ bounds, options, view }))
          )
        );
      }
    }
  },
  kernelLabel: 'Kumiko',
  loadKernel,
  nouns: 'panels',
  overlay: sceneIconFile('kumiko'),
  parseCli,
  progressLabel: 'rendering panels',
  resolveViews,
  script: 'kumiko',
  setup: ({ kernel, options, typed }) => ({
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'kumiko',
  usageFor,
  withCapturer,
});
