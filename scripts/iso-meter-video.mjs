#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies */
import sharp from 'sharp';

import { usageFor } from '../src/modules/isoMeter/renderOptions.mjs';
import { runVideo } from './lib/generatorCli.mjs';
import {
  WINTERKAMMER_MAX_FRAMES,
  assertPalette,
  blockSvg,
  createPiece,
  loadKernel,
  parseCli,
  pieceAt,
  pieceSvg,
  rasterSize,
  rasterize,
  rollArgs,
  winterkammerPainter,
} from './lib/isoMeterRender.mjs';
import { withVoxelCapturer } from './lib/isoMeterVoxel.mjs';
import { sceneIconFile } from './lib/sceneIcons.mjs';

const WINTERKAMMER_FPS = 30;

function settleFrames(kernel, config, stops, options) {
  const piece = createPiece(kernel, { config, stops }, options);
  const run = kernel.isoMeter.createWinterkammerRun(piece, { settleFrames: 1 });
  while (!run.settled && run.frame < WINTERKAMMER_MAX_FRAMES) run.step(null);
  return run.frame;
}

function stillShot(kernel, item, options, frames) {
  let image = null;
  return {
    async enter() {
      const piece = createPiece(kernel, item, options);
      image = await rasterize(
        pieceSvg(kernel, piece, item.config, options),
        options
      );
    },
    frame: () => image.data,
    frames,
  };
}

function blockShot(kernel, item, options) {
  const { buildSeconds, fps, hold } = options;
  const frames = Math.max(1, Math.round((buildSeconds + hold) * fps));
  let piece = null;
  let build = null;
  let shown = { frame: null, levels: -1 };
  let stepped = 0;
  return {
    enter() {
      piece = createPiece(kernel, item, options);
      build = kernel.isoMeter.createBuild(piece);
    },
    async frame(capturer, { seconds }) {
      const total = piece.levels.length;
      const target = Math.min(
        total,
        Math.ceil((seconds / buildSeconds) * total)
      );
      if (target === shown.levels) return shown.frame;
      build.step(target - stepped);
      stepped = target;
      const style = build.done ? 'final' : 'build';
      const svg = blockSvg(kernel, piece, build, item.config, options, style);
      shown = { frame: (await rasterize(svg, options)).data, levels: target };
      return shown.frame;
    },
    frames,
  };
}

function winterkammerShot(kernel, item, options) {
  const { fps, hold } = options;
  const steps = settleFrames(kernel, item.config, item.stops, options);
  const frames = Math.max(
    1,
    Math.round((steps / WINTERKAMMER_FPS + hold) * fps)
  );
  const size = rasterSize(options);
  let piece = null;
  let run = null;
  let canvas = null;
  return {
    enter() {
      piece = createPiece(kernel, item, options);
      run = kernel.isoMeter.createWinterkammerRun(piece, { settleFrames: 1 });
      canvas = Buffer.alloc(size.width * size.height * 4);
      for (let n = 0; n < canvas.length; n += 4) {
        canvas.set([...piece.background, 255], n);
      }
    },
    async frame(capturer, { seconds }) {
      const target = Math.min(
        steps,
        Math.max(1, Math.round(seconds * WINTERKAMMER_FPS))
      );
      if (run.frame >= target) return canvas;
      const painter = winterkammerPainter(kernel, piece, options);
      while (run.frame < target) run.step(painter);
      const stroke = await rasterize(painter.toString(), options);
      canvas = await sharp(canvas, {
        raw: { channels: 4, height: size.height, width: size.width },
      })
        .composite([
          {
            input: stroke.data,
            raw: { channels: 4, height: stroke.height, width: stroke.width },
          },
        ])
        .raw()
        .toBuffer();
      return canvas;
    },
    frames,
  };
}

function voxelShot(kernel, item, options) {
  const { buildSeconds, cameraView, fps, hold, mode, turns } = options;
  const winterkammer = item.config.piece === 'winterkammer';
  const steps =
    mode === 'build' && winterkammer
      ? settleFrames(kernel, item.config, item.stops, options)
      : 0;
  let seconds = hold;
  if (mode === 'build') {
    seconds = (winterkammer ? steps / WINTERKAMMER_FPS : buildSeconds) + hold;
  }
  const frames = Math.max(1, Math.round(seconds * fps));
  let loaded = null;
  let still = null;
  return {
    enter(capturer) {
      const piece = createPiece(kernel, item, options);
      loaded = capturer.load(piece, item.config, {
        animate: mode === 'build',
      });
    },
    async frame(capturer, clock) {
      if (mode === 'montage') {
        still ??= (await capturer.capture({ view: cameraView })).data;
        return still;
      }
      if (mode === 'build') {
        const target = winterkammer
          ? Math.max(1, Math.round(clock.seconds * WINTERKAMMER_FPS))
          : Math.min(
              loaded.levels,
              Math.ceil((clock.seconds / buildSeconds) * loaded.levels)
            );
        loaded.advance(target);
      }
      const azimuthOffset =
        mode === 'turntable' ? (360 * turns * clock.frame) / frames : 0;
      return (await capturer.capture({ azimuthOffset, view: cameraView })).data;
    },
    frames,
  };
}

runVideo({
  kernelLabel: 'IsoMeter',
  loadKernel,
  nouns: 'pieces',
  overlay: sceneIconFile('iso-meter'),
  parseCli,
  plan({ kernel, options, parsed, typed }) {
    assertPalette(kernel, parsed);
    const roll = rollArgs(kernel, { options, typed });
    const batch = options.batch ?? kernel.isoMeter.randomBatch();
    const items = Array.from({ length: options.count }, (_, index) =>
      pieceAt(kernel, { batch, index, roll })
    );
    const holdFrames = Math.max(1, Math.round(options.hold * options.fps));
    return {
      gpu: options.display === 'voxel',
      presets: () => items.map(({ config }) => config),
      shots: items.map((item) => {
        if (options.display === 'voxel')
          return voxelShot(kernel, item, options);
        if (options.mode === 'montage') {
          return stillShot(kernel, item, options, holdFrames);
        }
        return item.config.piece === 'winterkammer'
          ? winterkammerShot(kernel, item, options)
          : blockShot(kernel, item, options);
      }),
    };
  },
  script: 'iso-meter',
  size: rasterSize,
  title: 'iso meter',
  usageFor,
  withCapturer: withVoxelCapturer,
});
