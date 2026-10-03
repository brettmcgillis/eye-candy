#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/networkTest/renderOptions.mjs';
import createFrameSink from './lib/frameSink.mjs';
import {
  REPO_ROOT,
  loadKernel,
  networkAt,
  padFor,
  parseCli,
  rollArgs,
  withCapturer,
} from './lib/networkTestRender.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

const KIND = 'video';

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

async function main() {
  const parsed = await parseCli(KIND, process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run network-test:video -- [options]\n${usageFor(KIND)}`
    );
    return;
  }
  const { options, typed } = parsed;
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `network test video: mode ${options.mode}, ${options.count} networks, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `${options.fps}fps\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the NetworkTest kernel', loadKernel);
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
  const shots = items.map((drawn) => ({
    drawn,
    ...planShot(kernel, drawn, options),
  }));
  const total = shots.reduce((sum, shot) => sum + shot.frames, 0);
  const progress = createProgress('rendering frames', total);
  const sink = createFrameSink({
    fps: options.fps,
    height: options.height * options.pixelRatio,
    out,
    width: options.width * options.pixelRatio,
  });
  const moving =
    options.mode === 'turntable' ||
    options.mode === 'drift' ||
    options.mode === 'grow' ||
    options.orbit !== 0;

  let written = 0;
  try {
    await withCapturer(kernel, options, async (capturer) => {
      for (let s = 0; s < shots.length; s += 1) {
        const { drawn, frames, step } = shots[s];
        capturer.load(drawn);
        const pad = padFor(drawn, {
          drift: options.mode === 'drift' || options.mode === 'grow',
        });
        for (let frame = 0; frame < frames; frame += 1) {
          const azimuthOffset =
            options.mode === 'turntable'
              ? (360 * options.turns * frame) / frames
              : (options.orbit * frame) / frames;
          const image = await capturer.capture(
            net.frameView({
              azimuthOffset,
              options,
              pad,
              points: drawn.network.positions,
              stable: moving,
              view: options.view,
            }),
            step(frame)
          );
          await sink.write(image.data);
          written += 1;
          progress.update(written);
        }
      }
    });
  } finally {
    await runStage('finishing encode', () => sink.finish());
  }
  progress.done('rendered frames');

  const metadataPath = await writeVideoSidecar(out, {
    presets: items.map(({ config }) => config),
    render: { ...options, base: undefined, palettes: undefined },
  });
  process.stdout.write(
    `saved video: ${out}\nsaved metadata: ${metadataPath}\n`
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
