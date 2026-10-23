#!/usr/bin/env node
import { usageFor } from '../src/modules/kumiko/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  panelAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/kumikoRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runVideo({
  kernelLabel: 'Kumiko',
  loadKernel,
  nouns: 'panels',
  overlay: sceneIconFile('kumiko'),
  parseCli,
  async plan({ kernel, options, typed }) {
    const roll = rollArgs(kernel, { options, typed });
    const count = options.mode === 'hold' ? 1 : options.count;
    const panels = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        panelAt(kernel, { index, options, roll })
      )
    );
    const frames = Math.max(1, Math.round(options.hold * options.fps));
    return {
      presets: () => panels.map(({ config }) => config),
      shots: panels.map((drawn) => {
        let bounds = null;
        return {
          enter: async (capturer) => {
            bounds = await capturer.load(drawn);
          },
          frame: (capturer) =>
            capturer.capture(
              kernel.look.frameView({
                bounds,
                options,
                view: options.videoView,
              })
            ),
          frames,
        };
      }),
    };
  },
  script: 'kumiko',
  title: 'kumiko',
  usageFor,
  withCapturer,
});
