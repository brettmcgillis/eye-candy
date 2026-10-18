#!/usr/bin/env node
import { usageFor } from '../src/modules/networkTest/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  loadKernel,
  networkAt,
  padFor,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/networkTestRender.mjs';
import { runStage } from './lib/progress.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

// Each network is one shot: how many frames it runs for, and a stepper that
// is called once per frame, in order, on a fixed clock.
function planShot(kernel, drawn, options) {
  const { net } = kernel;
  const { config, network, stops } = drawn;
  const { fps } = options;
  const dt = 1 / fps;
  const pulses = net.createPulses(config.wireSeed, config.pulseCount);

  // The scene's cycle: grow out, hold, grow back in, with the points
  // drifting and signals on the grown edges all the way through.
  if (options.mode === 'grow') {
    const clock = { ...config, holdSeconds: options.hold };
    const drift = net.createDrift(network, config);
    const frames = Math.max(1, Math.round(net.growCycleSeconds(clock) * fps));
    return {
      frames,
      step(frame) {
        const grow = net.growAt(frame * dt, clock);
        const positions =
          config.driftAmount > 0 ? drift(frame * dt) : network.positions;
        pulses.step(network, positions, dt, config.pulseSpeed, grow);
        return net.buildInstances({
          config,
          grow,
          network,
          positions,
          pulses: pulses.pulses,
          stops,
        });
      },
    };
  }

  const frames = Math.max(1, Math.round(options.hold * fps));
  if (options.mode === 'drift') {
    const clock = net.createDriftClock(network, config);
    return {
      frames,
      step(frame) {
        const now = clock.step(frame * dt, dt);
        pulses.step(now.network, now.positions, dt, config.pulseSpeed);
        return net.buildInstances({
          config,
          edges: now.edges,
          network: now.network,
          positions: now.positions,
          pulses: pulses.pulses,
          stops,
        });
      },
    };
  }

  return {
    frames,
    step() {
      pulses.step(network, network.positions, dt, config.pulseSpeed);
      return net.buildInstances({
        config,
        network,
        pulses: pulses.pulses,
        stops,
      });
    },
  };
}

runVideo({
  kernelLabel: 'NetworkTest',
  loadKernel,
  nouns: 'networks',
  overlay: sceneIconFile('network-test'),
  parseCli,
  async plan({ kernel, options, typed }) {
    const { net } = kernel;
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? net.randomSeed();
    const items = await runStage(`building ${options.count} networks`, () =>
      Promise.all(
        Array.from({ length: options.count }, (_, index) =>
          networkAt(kernel, { batch, index, roll })
        )
      )
    );
    const moving =
      options.mode === 'turntable' ||
      options.mode === 'drift' ||
      options.mode === 'grow' ||
      options.orbit !== 0;
    const pad = (drawn) =>
      padFor(drawn, {
        drift: options.mode === 'drift' || options.mode === 'grow',
      });
    return {
      presets: () => items.map(({ config }) => config),
      shots: items.map((drawn) => {
        const { frames, step } = planShot(kernel, drawn, options);
        return {
          enter: (capturer) => capturer.load(drawn),
          frame: (capturer, { frame }) =>
            capturer.capture(
              net.frameView({
                azimuthOffset:
                  options.mode === 'turntable'
                    ? (360 * options.turns * frame) / frames
                    : (options.orbit * frame) / frames,
                options,
                pad: pad(drawn),
                points: drawn.network.positions,
                stable: moving,
                view: options.view,
              }),
              step(frame)
            ),
          frames,
        };
      }),
    };
  },
  script: 'network-test',
  title: 'network test',
  usageFor,
  withCapturer,
});
