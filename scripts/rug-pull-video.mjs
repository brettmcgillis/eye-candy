#!/usr/bin/env node
import { usageFor } from '../src/modules/rugPull/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  drape,
  loadKernel,
  parseCli,
  rollArgs,
  rugAt,
  withCapturer,
} from './lib/rugPullRender.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runVideo({
  kernelLabel: 'Rug Pull',
  loadKernel,
  nouns: 'rugs',
  overlay: sceneIconFile('rug-pull'),
  parseCli,
  plan({ kernel, options, typed }) {
    const batch = options.batch ?? kernel.rug.randomSeed();
    const roll = rollArgs(kernel, { options, typed });
    const count = options.mode === 'hold' ? 1 : options.count;
    const rugs = Array.from({ length: count }, (_, index) =>
      rugAt(kernel, { batch, index, roll })
    );
    const frames = Math.max(1, Math.round(options.hold * options.fps));
    const mode = options.videoView;
    return {
      presets: () => rugs.map(({ config }) => config),
      shots: rugs.map((woven) => {
        let draped = null;
        return {
          enter(capturer) {
            capturer.load(woven);
            draped = drape(kernel, woven, mode, options.settleSteps);
          },
          frame: (capturer) =>
            capturer.capture(
              kernel.look.rugView(
                woven,
                draped,
                mode,
                options.width / options.height
              ),
              draped,
              { config: woven.config, mode }
            ),
          frames,
        };
      }),
    };
  },
  script: 'rug-pull',
  title: 'rug pull',
  usageFor,
  withCapturer,
});
