#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/kumiko/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import {
  loadKernel,
  panelAt,
  parseCli,
  renderFlatSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/kumikoRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

const solidOf = (views, options) =>
  views.filter(
    (view) =>
      view !== 'flat' ||
      options.paintStyle !== 'original' ||
      (options.base?.paintStyle && options.base.paintStyle !== 'original') ||
      (options.base?.preset?.paintStyle &&
        options.base.preset.paintStyle !== 'original')
  );

runStills({
  doneLabel: 'rendered panels',
  // `flat` is the 2D art; only the 3D views need the GPU.
  gpu: ({ formats, options, views }) =>
    solidOf(views, options).length > 0 && formats.length > 0,
  async item({ capturer, index, kernel, options, roll, save, step, views }) {
    const drawn = await step(`building panel ${index + 1}`, async () =>
      panelAt(kernel, { index, options, roll })
    );
    const out = await save(drawn.seed, sidecarFor({ ...drawn, options }));
    // The SVG is the flat art; it takes the name of the still it sits beside,
    // so the gallery shows one item with both formats.
    const svgName = `${views.includes('flat') ? 'flat' : (views[0] ?? 'flat')}.svg`;
    if (options.svg) {
      await out.file(
        svgName,
        renderFlatSvg(kernel, { ...drawn, options }, options.svgStyle)
      );
    }
    if (views.includes('flat') && drawn.config.paintStyle === 'original') {
      await out.image('flat', () =>
        Buffer.from(renderFlatSvg(kernel, { ...drawn, options }, 'fill'))
      );
    }
    if (capturer) {
      const bounds = await step(`placing ${drawn.seed}`, async () =>
        capturer.load(drawn)
      );
      const solid = solidOf(views, drawn.config);
      for (let v = 0; v < solid.length; v += 1) {
        const view = solid[v];
        // eslint-disable-next-line no-await-in-loop
        await out.image(view, () =>
          step(`rendering ${drawn.seed}, ${view}`, () =>
            capturer.capture(kernel.look.frameView({ bounds, options, view }))
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
