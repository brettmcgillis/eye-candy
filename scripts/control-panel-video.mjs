#!/usr/bin/env node
import { usageFor } from '../src/modules/controlPanel/renderOptions.mjs';
import {
  loadKernel,
  panelAt,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/controlPanelRender.mjs';
import { azimuthOffset, runVideo } from './lib/generatorCli.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// The seconds of a panel's shot and the moment each frame shows: operate
// runs the controls' clock, montage holds a still, build rises in first,
// drift slides a close-in camera over the face.
function shotOf(kernel, drawn, options) {
  const { STILL_TIME } = kernel.panel;
  const { buildSeconds } = drawn.config;
  if (options.mode === 'build') {
    return {
      seconds: buildSeconds + options.hold,
      moment: (s) => ({
        build: s <= buildSeconds ? s : null,
        t: STILL_TIME + s,
      }),
    };
  }
  if (options.mode === 'montage') {
    return { seconds: options.hold, moment: () => ({ t: STILL_TIME }) };
  }
  return { seconds: options.hold, moment: (s) => ({ t: STILL_TIME + s }) };
}

const driftPan = (u) => [
  Math.sin((u * 2 - 1) * (Math.PI / 2)),
  0.7 * Math.sin(u * Math.PI * 2),
];

runVideo({
  kernelLabel: 'ControlPanel',
  loadKernel,
  nouns: 'panels',
  overlay: sceneIconFile('control-panel'),
  parseCli,
  plan({ kernel, options, typed }) {
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? kernel.panel.randomSeed();
    const items = Array.from({ length: options.count }, (_, index) =>
      panelAt(kernel, { batch, index, roll })
    );
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        const { moment, seconds } = shotOf(kernel, drawn, options);
        const frames = Math.max(1, Math.round(seconds * options.fps));
        let bounds = null;
        let held = null;
        return {
          enter(capturer) {
            bounds = capturer.load(drawn);
            held = null;
          },
          async frame(capturer, clock) {
            if (options.mode === 'montage' && held) return held;
            const view = kernel.panel.frameView({
              azimuthOffset: azimuthOffset(options, clock),
              bounds,
              detail: drawn.panel.detail,
              options,
              pan:
                options.mode === 'drift'
                  ? driftPan(clock.frame / Math.max(frames - 1, 1))
                  : null,
              view: options.view,
            });
            const image = await capturer.capture(view, moment(clock.seconds));
            if (options.mode === 'montage') held = image;
            return image;
          },
          frames,
        };
      }),
    };
  },
  script: 'control-panel',
  title: 'control panel',
  usageFor,
  withCapturer,
});
