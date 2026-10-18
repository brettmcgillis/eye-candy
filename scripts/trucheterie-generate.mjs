#!/usr/bin/env node
import { usageFor } from '../src/modules/trucheterieBlob/renderOptions.mjs';
import { runStills } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';
import {
  assertPalette,
  buildField,
  fieldAt,
  loadKernel,
  parseCli,
  renderSvg,
  rollArgs,
  sidecarFor,
  withCapturer,
} from './lib/trucheterieBlobRender.mjs';

runStills({
  doneLabel: 'rendered fields',
  async item({ capturer, index, kernel, options, roll, save, step }) {
    const drawn = fieldAt(kernel, { index, options, roll });
    await step(`rendering ${drawn.seed}`, async () => {
      const bounds = capturer.setField(drawn.config);
      const out = await save(drawn.seed, sidecarFor({ ...drawn, options }));
      await out.image('field', () =>
        capturer.capture({
          backgroundColor: drawn.config.sceneBgColor,
          bounds,
          margin: options.margin,
          transparentBackground: options.transparentBackground,
        })
      );
      if (options.svg) {
        const field = buildField(kernel, drawn.config);
        await out.file(
          'field.svg',
          renderSvg(kernel, field, drawn.config, options)
        );
      }
    });
  },
  kernelLabel: 'Trucheterie blob-field',
  loadKernel,
  nouns: 'fields',
  overlay: sceneIconFile('trucheterie'),
  parseCli,
  progressLabel: 'rendering fields',
  script: 'trucheterie',
  setup({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return { roll: rollArgs(kernel, { options, typed }) };
  },
  title: 'trucheterie',
  usageFor,
  withCapturer,
});
