#!/usr/bin/env node
import { usageFor } from '../src/modules/isoLines/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  parseCli,
  pieceAt,
  rollArgs,
  withCapturer,
} from './lib/isoLinesRender.mjs';
import { runStage } from './lib/progress.mjs';

// Each piece is one shot of the field flowing for `hold` seconds, on a
// fixed clock.
function planShot(kernel, drawn, options, aspect) {
  const { config, image } = drawn;
  const builder = kernel.iso.createIsoBuilder();
  return {
    frames: Math.max(1, Math.round(options.hold * options.fps)),
    step: (frame) =>
      builder.build(config, { aspect, image, time: frame / options.fps }),
  };
}

runVideo({
  kernelLabel: 'IsoLines',
  loadKernel,
  nouns: 'pieces',
  parseCli,
  async plan({ kernel, options, typed }) {
    const { iso } = kernel;
    const aspect = options.width / options.height;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? iso.randomSeed();
    const items = await runStage(`rolling ${options.count} pieces`, () =>
      Promise.all(
        Array.from({ length: options.count }, (_, index) =>
          pieceAt(kernel, { batch, index, roll })
        )
      )
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        const { frames, step } = planShot(kernel, drawn, options, aspect);
        return {
          enter: (capturer) => capturer.load(drawn, options.pixelRatio),
          frame: (capturer, { frame }) =>
            capturer.capture(iso.flatView(aspect), step(frame)),
          frames,
        };
      }),
    };
  },
  script: 'iso-lines',
  title: 'iso lines',
  usageFor,
  withCapturer,
});
