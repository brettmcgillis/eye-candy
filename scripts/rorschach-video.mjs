#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

import {
  VIEWS,
  defaultsFor,
  normalizeOptions,
  resolveIgPreset,
  usageFor,
} from '../src/modules/rorschach/renderOptions.mjs';
import { parseArgs, readPackageVersion } from './lib/cliArgs.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  applyOverlay,
  buildTest,
  disposeCapturers,
  loadKernel,
  renderFrame,
  setGrowth,
} from './lib/rorschachRender.mjs';

const DEFAULTS = defaultsFor('video');

function usage() {
  process.stdout.write(
    `Usage: npm run rorschach:video -- [options]\n${usageFor('video')}`
  );
}

function run(command, args, onProgress) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', onProgress ? 'pipe' : 'ignore', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    // `-progress pipe:1` emits repeating key=value blocks; `frame=` is the only
    // one we need to drive a bar.
    if (onProgress) {
      let pending = '';
      child.stdout.on('data', (chunk) => {
        pending += chunk;
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        lines.forEach((line) => {
          const [key, value] = line.split('=');
          if (key === 'frame') onProgress(Number(value));
        });
      });
    }

    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited ${code}\n${stderr.slice(-2000)}`))
    );
  });
}

function capture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${command} exited ${code}\n${stderr.slice(-2000)}`))
    );
  });
}

function parseRate(rate) {
  const [numerator, denominator] = String(rate).split('/').map(Number);
  return denominator ? numerator / denominator : numerator;
}

async function writeVideoMetadata(out, options, presets) {
  const stdout = await capture('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-count_frames',
    '-count_packets',
    '-show_entries',
    'stream=codec_name,profile,width,height,pix_fmt,avg_frame_rate,nb_frames,nb_read_frames,nb_read_packets,bit_rate:format=format_name,duration,size,bit_rate',
    '-of',
    'json',
    out,
  ]);
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0] ?? {};
  const format = probe.format ?? {};
  const file = await stat(out);
  const metadataPath = out.replace(/\.[^.]+$/u, '.json');
  let resolvedSeed = options.seed;
  if (typeof resolvedSeed !== 'number') {
    resolvedSeed =
      options.mode === 'stills' ? null : (presets[0]?.seed ?? null);
  }
  const metadata = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    presets,
    render: { ...options, seed: resolvedSeed },
    encoding: {
      codec: 'libx264',
      crf: 17,
      pixelFormat: 'yuv420p',
      preset: 'slow',
    },
    video: {
      bitRate: Number(format.bit_rate || stream.bit_rate) || null,
      codec: stream.codec_name ?? null,
      durationSeconds: Number(format.duration) || null,
      fileSizeBytes: Number(format.size) || file.size,
      format: format.format_name ?? null,
      frameCount:
        Number(
          stream.nb_frames || stream.nb_read_frames || stream.nb_read_packets
        ) || null,
      frameRate: parseRate(stream.avg_frame_rate) || null,
      height: stream.height ?? null,
      pixelFormat: stream.pix_fmt ?? null,
      profile: stream.profile ?? null,
      width: stream.width ?? null,
    },
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadataPath;
}

// Encodes are the one step with no natural per-item output — a minute of
// silence on a long clip — so every ffmpeg call reports frames against the
// total the caller already knows it asked for.
async function encode(args, { label, totalFrames }) {
  const progress = createProgress(label, totalFrames);
  await run('ffmpeg', ['-progress', 'pipe:1', '-nostats', ...args], (frame) =>
    progress.update(frame)
  );
  progress.done(`${label} complete`);
}

// yuv420p needs even dimensions, and the scale filter guards against an odd
// --width slipping through.
const SIZE_FILTER = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
const ENCODE_FILTER = `${SIZE_FILTER},format=yuv420p`;

async function encodeFrames(dir, { fps, out, totalFrames }) {
  await encode(
    [
      '-y',
      '-framerate',
      String(fps),
      '-i',
      path.join(dir, 'frame-%05d.png'),
      '-vf',
      ENCODE_FILTER,
      '-c:v',
      'libx264',
      '-crf',
      '17',
      '-preset',
      'slow',
      out,
    ],
    { label: 'encoding', totalFrames }
  );
}

// Cuts: the concat demuxer with a duration per entry.
//
// Two things here are load-bearing. The frame rate is set with an `fps` filter
// rather than `-r`, because `-r` on a concat stream resamples the timestamps
// and stretched a 6s clip to 8s; and the list must NOT repeat the final file,
// the usual concat idiom — with an `fps` filter that duplicate is handed a full
// `hold` of its own and adds a phantom shot. (`-vsync` is also gone: ffmpeg 8
// rejects it outright.)
async function encodeCuts(files, { fps, hold, out, tmp }) {
  const list = files
    .map((file) => `file '${file.replace(/'/g, "'\\''")}'\nduration ${hold}`)
    .join('\n');
  const listPath = path.join(tmp, 'list.txt');
  await writeFile(listPath, `${list}\n`);

  try {
    await encode(
      [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listPath,
        '-vf',
        `${SIZE_FILTER},fps=${fps},format=yuv420p`,
        '-c:v',
        'libx264',
        '-crf',
        '17',
        '-preset',
        'slow',
        out,
      ],
      { label: 'encoding', totalFrames: Math.round(files.length * hold * fps) }
    );
  } finally {
    await rm(listPath, { force: true });
  }
}

// Crossfades: chain one xfade per gap. Each still is decoded for hold+cross
// seconds so there is material to fade into, which puts every transition at a
// clean multiple of `hold`.
async function encodeCrossfade(files, { crossfade, fps, hold, out }) {
  const clip = hold + crossfade;
  const inputs = files.flatMap((file) => [
    '-loop',
    '1',
    '-t',
    String(clip),
    '-i',
    file,
  ]);

  const steps = files.map((unused, i) => `[${i}:v]setsar=1[s${i}]`);
  let last = '[s0]';
  files.slice(1).forEach((unused, index) => {
    const label = `[x${index}]`;
    steps.push(
      `${last}[s${index + 1}]xfade=transition=fade:duration=${crossfade}` +
        `:offset=${((index + 1) * hold).toFixed(3)}${label}`
    );
    last = label;
  });
  steps.push(`${last}${ENCODE_FILTER}[v]`);

  await encode(
    [
      '-y',
      ...inputs,
      '-filter_complex',
      steps.join(';'),
      '-map',
      '[v]',
      '-r',
      String(fps),
      '-c:v',
      'libx264',
      '-crf',
      '17',
      '-preset',
      'slow',
      out,
    ],
    {
      label: 'encoding',
      totalFrames: Math.round((files.length * hold + crossfade) * fps),
    }
  );
}

async function collectExisting(dir, view) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => Number(a) - Number(b))
    .map((name) => path.join(dir, name, `${view}.png`));
}

async function renderStills(kernel, { options, tmp }) {
  if (options.in) {
    const dir = path.resolve(REPO_ROOT, String(options.in));
    const files = await runStage('collecting existing stills', () =>
      collectExisting(dir, options.view)
    );
    process.stdout.write(`  collected ${files.length} stills from ${dir}\n`);
    return { files, presets: [] };
  }

  const files = [];
  const presets = [];
  const persistent = typeof options.stillsOut === 'string';
  const progress = createProgress('rendering stills', options.count);
  for (let i = 0; i < options.count; i += 1) {
    const seed =
      typeof options.seed === 'number' ? options.seed + i : kernel.randomSeed();
    progress.log(`test ${i + 1}/${options.count}: generating seed ${seed}`);

    const config = kernel.rollTestConfig(seed);
    presets.push(config);
    const test = buildTest(kernel, config);
    const raster = await renderFrame(kernel, {
      config,
      options,
      test,
      view: options.view,
    });
    const image =
      options.imageFormat === 'webp'
        ? await sharp(raster).webp({ lossless: true }).toBuffer()
        : raster;
    const outputDir = persistent ? path.join(tmp, String(seed)) : tmp;
    const file = path.join(
      outputDir,
      persistent
        ? `${options.view}.${options.imageFormat}`
        : `still-${String(i).padStart(5, '0')}.${options.imageFormat}`
    );
    await mkdir(outputDir, { recursive: true });
    if (persistent) {
      await writeFile(
        path.join(outputDir, 'props.json'),
        `${JSON.stringify({ preset: config, render: options }, null, 2)}\n`
      );
    }
    await writeFile(file, image);
    files.push(file);
    progress.update(i + 1);
  }
  progress.done('rendered stills');
  return { files, presets };
}

async function renderTurntable(kernel, { options, tmp }) {
  const seed =
    typeof options.seed === 'number' ? options.seed : kernel.randomSeed();
  const config = kernel.rollTestConfig(seed);
  const test = buildTest(kernel, config);
  const total = Math.round(options.hold * options.fps * options.turns);
  process.stdout.write(
    `rendering turntable: test ${seed}, ${options.turns} turns, ${total} frames\n`
  );
  const progress = createProgress('rendering frames', total);

  for (let frame = 0; frame < total; frame += 1) {
    const azimuth = (frame / (options.hold * options.fps)) * Math.PI * 2;
    const png = await renderFrame(kernel, {
      config,
      eye: kernel.orbitEye(azimuth, 0, options.distance),
      options,
      test,
    });
    await writeFile(
      path.join(tmp, `frame-${String(frame).padStart(5, '0')}.png`),
      png
    );
    progress.update(frame + 1);
  }
  progress.done('rendered frames');
  return { presets: [config], totalFrames: total };
}

async function renderGrowth(kernel, { options, tmp }) {
  const first =
    typeof options.seed === 'number' ? options.seed : kernel.randomSeed();
  const framesPerTest = Math.max(2, Math.round(options.hold * options.fps));
  const views = options.growthView === 'all' ? VIEWS : [options.growthView];
  const grid =
    options.growthView === 'all' && options.growthPresentation === 'grid';
  const cellWidth = Math.floor(options.width / 2);
  const cellHeight = Math.floor(options.height / 2);
  const cellOptions = {
    ...options,
    height: cellHeight,
    overlay: false,
    width: cellWidth,
  };
  const framesPerViewSet = grid ? framesPerTest : framesPerTest * views.length;
  const total = framesPerViewSet * options.count;
  const progress = createProgress('rendering growth', total);
  const presets = [];

  process.stdout.write(
    `rendering growth: ${options.count} tests, ${options.hold}s each, ` +
      `${options.growthView} view${grid ? ' grid' : ''}, ${total} frames\n`
  );

  let frame = 0;
  const sourceRoot =
    typeof options.stillsOut === 'string'
      ? path.resolve(REPO_ROOT, options.stillsOut)
      : null;

  for (let testIndex = 0; testIndex < options.count; testIndex += 1) {
    const config = kernel.rollTestConfig(first + testIndex);
    presets.push(config);
    const test = buildTest(kernel, config);
    progress.log(
      `test ${testIndex + 1}/${options.count}: generated seed ${config.seed}`
    );
    let finalFrame = null;

    if (grid) {
      for (let localFrame = 0; localFrame < framesPerTest; localFrame += 1) {
        setGrowth(test, localFrame / (framesPerTest - 1));
        const cells = [];
        for (let viewIndex = 0; viewIndex < views.length; viewIndex += 1) {
          const view = views[viewIndex];
          cells.push({
            input: await renderFrame(kernel, {
              config,
              options: cellOptions,
              test,
              view,
            }),
            left: (viewIndex % 2) * cellWidth,
            top: Math.floor(viewIndex / 2) * cellHeight,
          });
        }
        const composite = await sharp({
          create: {
            background: { alpha: 1, b: 0, g: 0, r: 0 },
            channels: 4,
            height: options.height,
            width: options.width,
          },
        })
          .composite(cells)
          .png()
          .toBuffer();
        const png = await applyOverlay(composite, options);
        finalFrame = png;
        await writeFile(
          path.join(tmp, `frame-${String(frame).padStart(5, '0')}.png`),
          png
        );
        frame += 1;
        progress.update(frame);
      }
    } else {
      for (let viewIndex = 0; viewIndex < views.length; viewIndex += 1) {
        const view = views[viewIndex];
        for (let localFrame = 0; localFrame < framesPerTest; localFrame += 1) {
          setGrowth(test, localFrame / (framesPerTest - 1));
          const png = await renderFrame(kernel, {
            config,
            options,
            test,
            view,
          });
          finalFrame = png;
          await writeFile(
            path.join(tmp, `frame-${String(frame).padStart(5, '0')}.png`),
            png
          );
          frame += 1;
          progress.update(frame);
        }
      }
    }

    if (sourceRoot && finalFrame) {
      const outputDir = path.join(sourceRoot, String(config.seed));
      const image =
        options.imageFormat === 'webp'
          ? await sharp(finalFrame).webp({ lossless: true }).toBuffer()
          : finalFrame;
      await mkdir(outputDir, { recursive: true });
      await Promise.all([
        writeFile(path.join(outputDir, `final.${options.imageFormat}`), image),
        writeFile(
          path.join(outputDir, 'props.json'),
          `${JSON.stringify(
            {
              preset: config,
              render: { ...options, seed: first },
              sequence: { index: testIndex, total: options.count },
            },
            null,
            2
          )}\n`
        ),
      ]);
      progress.log(`saved test ${config.seed}: ${outputDir}`);
    }
  }
  progress.done('rendered growth');
  return { presets, totalFrames: total };
}

async function renderCinematic(kernel, { options, tmp }) {
  const first =
    typeof options.seed === 'number' ? options.seed : kernel.randomSeed();
  const total = Math.round(options.hold * options.fps * options.systems);
  process.stdout.write(
    `rendering cinematic: ${options.systems} systems, ${total} frames\n`
  );

  const progress = createProgress('rendering frames', total);
  const presets = [];
  let currentIndex = -1;
  let config = null;
  let test = null;

  for (let frame = 0; frame < total; frame += 1) {
    const state = kernel.cinematicState(frame / options.fps, {
      secondsPerSystem: options.hold,
    });

    // Each system is generated once, on the frame its half-revolution starts;
    // every later frame only moves the reveal cursor and the camera.
    if (state.systemIndex !== currentIndex) {
      currentIndex = state.systemIndex;
      config = kernel.rollTestConfig(first + currentIndex);
      presets.push(config);
      test = buildTest(kernel, config);
      progress.log(`system ${currentIndex + 1}: generated seed ${config.seed}`);
    }

    setGrowth(test, state.growth);
    const png = await renderFrame(kernel, {
      config,
      eye: kernel.orbitEye(state.azimuth, 0, options.distance),
      options: { ...options, flatten: state.flatten },
      test,
    });
    await writeFile(
      path.join(tmp, `frame-${String(frame).padStart(5, '0')}.png`),
      png
    );
    progress.update(frame + 1);
  }
  progress.done('rendered frames');
  return { presets, totalFrames: total };
}

async function main() {
  const args = parseArgs(process.argv.slice(2), DEFAULTS);
  if (args.help) {
    usage();
    return;
  }
  const validated = normalizeOptions('video', args);
  const options = {
    ...validated,
    ig: resolveIgPreset(validated.ig),
    version: await readPackageVersion(),
  };
  const out = path.resolve(REPO_ROOT, String(options.out));
  await mkdir(path.dirname(out), { recursive: true });
  process.stdout.write(
    `rorschach video: mode ${options.mode}, ${options.width}x${options.height}, ` +
      `${options.fps}fps, renderer ${options.renderer}, ` +
      `overlay ${options.overlay ? 'on' : 'off'}\n` +
      `output: ${out}\n`
  );

  const kernel = await runStage('loading the Rorschach kernel', loadKernel);
  const persistentStills =
    options.mode === 'stills' &&
    !options.in &&
    typeof options.stillsOut === 'string';
  const tmp = persistentStills
    ? path.resolve(REPO_ROOT, options.stillsOut)
    : await mkdtemp(path.join(os.tmpdir(), 'rorschach-'));
  if (persistentStills) {
    await rm(tmp, { force: true, recursive: true });
    await mkdir(tmp, { recursive: true });
  }

  try {
    let presets;
    if (options.mode === 'stills') {
      const rendered = await renderStills(kernel, { options, tmp });
      const { files } = rendered;
      presets = rendered.presets;
      if (files.length === 0) throw new Error('no stills to stitch');

      process.stdout.write(
        `encoding video: ${files.length} stills at ${options.fps}fps, ` +
          `${options.hold}s hold, ${options.crossfade}s crossfade\n`
      );
      if (options.crossfade > 0 && files.length > 1) {
        await encodeCrossfade(files, {
          crossfade: options.crossfade,
          fps: options.fps,
          hold: options.hold,
          out,
        });
      } else {
        await encodeCuts(files, {
          fps: options.fps,
          hold: options.hold,
          out,
          tmp,
        });
      }
    } else {
      let rendered;
      if (options.mode === 'growth') {
        rendered = await renderGrowth(kernel, { options, tmp });
      } else if (options.mode === 'turntable') {
        rendered = await renderTurntable(kernel, { options, tmp });
      } else {
        rendered = await renderCinematic(kernel, { options, tmp });
      }
      presets = rendered.presets;
      await encodeFrames(tmp, {
        fps: options.fps,
        out,
        totalFrames: rendered.totalFrames,
      });
    }

    process.stdout.write(`saved video: ${out}\n`);
    const metadataPath = await writeVideoMetadata(out, options, presets);
    process.stdout.write(`saved metadata: ${metadataPath}\n`);
  } finally {
    await disposeCapturers();
    if (!persistentStills) {
      await runStage('removing temporary frames', () =>
        rm(tmp, { force: true, recursive: true })
      );
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
