#!/usr/bin/env node
import {
  resolveViews,
  usageFor,
} from '../src/modules/isoMeter/renderOptions.mjs';
import { runStills, sidecarFor } from './lib/generatorCli.mjs';
import {
  assertPalette,
  createPiece,
  loadKernel,
  parseCli,
  pieceAt,
  pieceSvg,
  rasterize,
  rollArgs,
  statsOf,
} from './lib/isoMeterRender.mjs';
import { withVoxelCapturer } from './lib/isoMeterVoxel.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

const voxel = (options) => options.display === 'voxel';

runStills({
  doneLabel: 'rendered pieces',
  gpu: ({ options }) => voxel(options),
  async item({ batch, capturer, index, kernel, options, roll, save, step }) {
    const drawn = pieceAt(kernel, { batch, index, roll });
    const label = `${drawn.name} (${drawn.config.piece})`;
    const piece = createPiece(kernel, drawn, options);
    const sidecar = {
      ...sidecarFor({ ...drawn, options }),
      stats: statsOf(piece),
    };
    if (voxel(options)) {
      await step(`building ${label} voxels`, async () =>
        capturer.load(piece, drawn.config)
      );
      const out = await save(drawn.name, sidecar);
      await out.eachView(async (view) => {
        await out.image(view, () => capturer.capture({ view }));
      });
      return;
    }
    await step(`rendering ${label}`, async () => {
      const svg = pieceSvg(kernel, piece, drawn.config, options);
      const out = await save(drawn.name, sidecar);
      await out.image('piece', () => rasterize(svg, options));
      if (options.svg) await out.svg('piece', svg);
    });
  },
  kernelLabel: 'IsoMeter',
  loadKernel,
  nouns: 'pieces',
  overlay: sceneIconFile('iso-meter'),
  parseCli,
  progressLabel: 'rendering pieces',
  resolveViews,
  script: 'iso-meter',
  setup({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    return {
      batch: options.batch ?? kernel.isoMeter.randomBatch(),
      roll: rollArgs(kernel, { options, typed }),
    };
  },
  title: 'iso meter',
  usageFor,
  withCapturer: withVoxelCapturer,
});
