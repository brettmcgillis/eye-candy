#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/controlPanel/renderOptions.mjs';
import {
  loadKernel,
  panelAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/controlPanelRender.mjs';
import { capturerSvg, runStills, sidecarFor } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runStills({
  kernelLabel: 'ControlPanel',
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = await step(`building panel ${index + 1}`, () =>
      panelAt(kernel, { batch, index, roll })
    );
    const bounds = await step(`dressing ${drawn.name}`, () =>
      capturer.load(drawn)
    );
    const out = await save(
      drawn.name,
      sidecarFor({ config: drawn.config, name: drawn.name, options })
    );
    await out.eachView(async (view) => {
      const framing = kernel.panel.frameView({
        bounds,
        detail: drawn.panel.detail,
        options,
        view,
      });
      await out.image(view, () => capturer.capture(framing));
      if (options.svg) {
        await out.svg(view, await capturerSvg(capturer, framing, options));
      }
    });
  },
  loadKernel,
  nouns: 'panels',
  overlay: sceneIconFile('control-panel'),
  parseCli,
  resolveViews,
  script: 'control-panel',
  setup: ({ kernel, options, typed }) => ({
    batch: options.batch ?? kernel.panel.randomSeed(),
    roll: rollArgs(kernel, { options, typed }),
  }),
  title: 'control panel',
  usageFor,
  withCapturer,
});
