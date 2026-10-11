#!/usr/bin/env node
import { usageFor } from '../src/modules/trucheterie3d/renderOptions.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import {
  assertPalette,
  fieldAt,
  loadKernel,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/trucheterie3dRender.mjs';

// Each field is one shot: how many frames it holds and what each frame sets
// before it is drawn (the growth reveal, the palette phase, or a step of
// the membrane's inflation from flat).
function planShot(kernel, drawn, options) {
  const { fps } = options;
  if (options.mode === 'growth') {
    const clock = { ...drawn.config, holdSeconds: options.hold };
    const seconds = kernel.tubes.growClipSeconds(clock);
    return {
      frames: Math.max(1, Math.round(seconds * fps)),
      prepare: (capturer, frame) =>
        capturer.setGrowth(
          kernel.tubes.growAt(frame / fps, clock, { loop: false })
        ),
    };
  }
  if (options.mode === 'flow') {
    return {
      frames: Math.max(1, Math.round(options.hold * fps)),
      prepare: (capturer, frame) =>
        capturer.setPalettePhase(
          (drawn.config.paletteDrift * frame) / options.fps
        ),
    };
  }
  if (options.mode === 'inflate' && drawn.membrane) {
    const seconds = kernel.tubes.inflateClipSeconds(drawn.config);
    return {
      flat: true,
      frames: Math.max(1, Math.round(seconds * fps)),
      prepare: (capturer, frame) =>
        capturer.stepMembrane(
          1 / fps,
          kernel.tubes.pressureAt(frame / fps, drawn.config)
        ),
    };
  }
  return {
    frames: Math.max(1, Math.round(options.hold * fps)),
    prepare: () => {},
  };
}

runVideo({
  kernelLabel: 'Trucheterie3D',
  loadKernel,
  nouns: 'fields',
  parseCli,
  plan({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    const roll = rollArgs(kernel, { options, typed });
    const baseSeed = options.blobSeed ?? kernel.tubes.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      fieldAt(kernel, { baseSeed, index, roll })
    );
    const stable = options.mode === 'turntable' || options.orbit !== 0;
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        const { flat, frames, prepare } = planShot(kernel, drawn, options);
        let bounds = null;
        return {
          enter(capturer) {
            bounds = capturer.load(drawn, { settle: !flat });
          },
          frame(capturer, clock) {
            prepare(capturer, clock.frame);
            return capturer.capture(
              kernel.tubes.frameView({
                azimuthOffset: azimuthOffset(options, clock),
                bounds,
                options,
                stable,
                view: options.view,
              })
            );
          },
          frames,
        };
      }),
    };
  },
  script: 'trucheterie3d',
  title: 'trucheterie3d',
  usageFor,
  withCapturer,
});
