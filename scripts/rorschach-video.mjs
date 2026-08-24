#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

import {
  defaultsFor,
  normalizeOptions,
  resolveIgPreset,
  usageFor,
} from '../src/modules/rorschach/renderOptions.mjs';
import { parseArgs, readPackageVersion } from './lib/cliArgs.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
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
    return files;
  }

  const files = [];
  const progress = createProgress('rendering stills', options.count);
  for (let i = 0; i < options.count; i += 1) {
    const seed =
      typeof options.seed === 'number' ? options.seed + i : kernel.randomSeed();
    progress.log(`test ${i + 1}/${options.count}: generating seed ${seed}`);

    const config = kernel.rollTestConfig(seed);
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

    const file = path.join(
      tmp,
      `still-${String(i).padStart(5, '0')}.${options.imageFormat}`
    );
    await writeFile(file, image);
    files.push(file);
    progress.update(i + 1);
  }
  progress.done('rendered stills');
  return files;
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
  return total;
}

async function renderCinematic(kernel, { options, tmp }) {
  const first =
    typeof options.seed === 'number' ? options.seed : kernel.randomSeed();
  const total = Math.round(options.hold * options.fps * options.systems);
  process.stdout.write(
    `rendering cinematic: ${options.systems} systems, ${total} frames\n`
  );

  const progress = createProgress('rendering frames', total);
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
  return total;
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
    if (options.mode === 'stills') {
      const files = await renderStills(kernel, { options, tmp });
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
      let totalFrames;
      if (options.mode === 'turntable') {
        totalFrames = await renderTurntable(kernel, { options, tmp });
      } else {
        totalFrames = await renderCinematic(kernel, { options, tmp });
      }
      await encodeFrames(tmp, { fps: options.fps, out, totalFrames });
    }

    process.stdout.write(`saved video: ${out}\n`);
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
