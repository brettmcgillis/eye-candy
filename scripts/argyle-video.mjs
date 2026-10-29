#!/usr/bin/env node
import { usageFor } from '../src/modules/argyle/renderOptions.mjs';
import { loadKernel, parseCli, withCapturer } from './lib/argyleRender.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

runVideo({
  kernelLabel: 'Argyle',
  loadKernel,
  parseCli,
  withCapturer,
  usageFor,
  nouns: 'patterns',
  overlay: sceneIconFile('argyle'),
  script: 'argyle',
  title: 'argyle',
  plan({ kernel, options, typed }) {
    const k = kernel.kernel;
    const batch = options.batch ?? k.randomSeed();
    const roll = k.rollArgs({ options, typed });
    const items = Array.from({ length: options.count }, (_, index) =>
      k.patternAt({ batch, index, roll })
    );
    return {
      presets: () => items.map((item) => item.config),
      shots: items.map((drawn) => {
        let framing;
        let duration = options.hold;
        if (options.mode === 'loop')
          duration =
            drawn.config.loopSeconds *
            Math.max(1, Math.round(options.hold / drawn.config.loopSeconds));
        const frames = Math.max(1, Math.round(duration * options.fps));
        return {
          frames,
          enter(capturer) {
            const bounds = capturer.load(drawn);
            framing = k.frameView({ bounds, options, view: options.view });
          },
          frame(capturer, clock) {
            const seconds =
              options.mode === 'montage'
                ? 0
                : (clock.frame / frames) * duration;
            return capturer.capture(framing, seconds);
          },
        };
      }),
    };
  },
});
