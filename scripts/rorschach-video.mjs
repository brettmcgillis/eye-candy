#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import {
  parseArgs,
  readPackageVersion,
  resolveIgPreset,
} from './lib/cliArgs.mjs';
import createProgress from './lib/progress.mjs';
import {
  REPO_ROOT,
  buildTest,
  disposeCapturers,
  loadSceneModules,
  renderFrame,
  setGrowth,
} from './lib/rorschachRender.mjs';

const MODES = ['stills', 'turntable', 'cinematic'];

// A vertical iPhone screen (12/13/14/15/16 at 19.5:9). Both dimensions are
// even, which yuv420p requires. Note this is taller than Instagram's 9:16, so
// a reel will letterbox or crop — pass --width 1080 --height 1920 for an
// IG-native frame.
const IPHONE_WIDTH = 1170;
const IPHONE_HEIGHT = 2532;

const DEFAULTS = {
  bloom: true,
  bloomRadius: 0.3,
  bloomStrength: 0.5,
  bloomThreshold: 1,
  count: 6,
  crossfade: 0.5,
  distance: 22,
  flatten: 0,
  flattenAxis: 'z',
  fov: 42,
  fps: 30,
  height: IPHONE_HEIGHT,
  hold: 2,
  ig: 'post',
  in: null,
  mode: 'stills',
  out: 'output/rorschach.mp4',
  overlay: true,
  renderer: 'gpu',
  simplify: 0.4,
  viewport: null,
  stroke: 0,
  systems: 3,
  turns: 1,
  view: 'front',
  width: IPHONE_WIDTH,
};

function usage() {
  process.stdout.write(
    `Usage: npm run rorschach:video -- [options]

  --mode M            ${MODES.join(' | ')} (default ${DEFAULTS.mode})
  --out FILE          Output video (default ${DEFAULTS.out})
  --fps N             Frame rate (default ${DEFAULTS.fps})
  --width / --height  Output pixels (default ${DEFAULTS.width}x${DEFAULTS.height}, a vertical iPhone)
  --seed S            First seed; omit for random
  --no-overlay        Skip the scene overlay burn-in (on by default)
  --ig PRESET         story|reel|post safe-area insets, or none (default ${DEFAULTS.ig})
  --viewport N        CSS pixel width the overlay emulates (default 390 with
                      --ig, else 1440)
  --renderer R        gpu (real WebGPU + post) or svg (approximation)
                      (default ${DEFAULTS.renderer})

 stills — one rolled test per shot, held then crossfaded
  --count N           How many tests (default ${DEFAULTS.count})
  --in DIR            Use PNGs from a rorschach:generate run instead
  --hold S            Seconds per still (default ${DEFAULTS.hold})
  --crossfade S       Seconds of fade between stills, 0 to cut (default ${DEFAULTS.crossfade})
  --view V            Which view to use (default ${DEFAULTS.view})

 turntable — one finished test, orbited
  --turns N           Full revolutions (default ${DEFAULTS.turns})
  --hold S            Seconds per revolution (default ${DEFAULTS.hold})

 cinematic — a new system grows each half-revolution, flattening at the far side
  --systems N         Half-revolutions, i.e. tests shown (default ${DEFAULTS.systems})
  --hold S            Seconds per half-revolution (default ${DEFAULTS.hold})
`
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

async function renderStills(modules, { options, tmp }) {
  if (options.in) {
    const dir = path.resolve(REPO_ROOT, String(options.in));
    process.stdout.write(`using stills from ${dir}\n`);
    return collectExisting(dir, options.view);
  }

  const files = [];
  for (let i = 0; i < options.count; i += 1) {
    const seed =
      typeof options.seed === 'number'
        ? options.seed + i
        : modules.randomSeed();
    process.stdout.write(`[${i + 1}/${options.count}] drawing test ${seed}\n`);

    const config = modules.rollTestConfig(seed);
    const test = buildTest(modules, config);
    const png = await renderFrame(modules, {
      config,
      options,
      test,
      view: options.view,
    });

    const file = path.join(tmp, `still-${String(i).padStart(5, '0')}.png`);
    await writeFile(file, png);
    files.push(file);
  }
  return files;
}

async function renderTurntable(modules, { options, tmp }) {
  const seed =
    typeof options.seed === 'number' ? options.seed : modules.randomSeed();
  const config = modules.rollTestConfig(seed);
  const test = buildTest(modules, config);
  const total = Math.round(options.hold * options.fps * options.turns);
  process.stdout.write(`orbiting test ${seed} over ${total} frames\n`);
  const progress = createProgress('rendering', total);

  for (let frame = 0; frame < total; frame += 1) {
    progress.update(frame);
    const azimuth = (frame / (options.hold * options.fps)) * Math.PI * 2;
    const png = await renderFrame(modules, {
      config,
      eye: modules.orbitEye(azimuth, 0, options.distance),
      options,
      test,
    });
    await writeFile(
      path.join(tmp, `frame-${String(frame).padStart(5, '0')}.png`),
      png
    );
  }
  progress.done('rendered frames');
  return total;
}

async function renderCinematic(modules, { cinematic, options, tmp }) {
  const first =
    typeof options.seed === 'number' ? options.seed : modules.randomSeed();
  const total = Math.round(options.hold * options.fps * options.systems);
  process.stdout.write(
    `cinematic: ${options.systems} systems over ${total} frames\n`
  );

  const progress = createProgress('rendering', total);
  let currentIndex = -1;
  let config = null;
  let test = null;

  for (let frame = 0; frame < total; frame += 1) {
    progress.update(frame);
    const state = cinematic.cinematicState(frame / options.fps, {
      secondsPerSystem: options.hold,
    });

    // Each system is generated once, on the frame its half-revolution starts;
    // every later frame only moves the reveal cursor and the camera.
    if (state.systemIndex !== currentIndex) {
      currentIndex = state.systemIndex;
      config = modules.rollTestConfig(first + currentIndex);
      test = buildTest(modules, config);
      process.stdout.write(
        `  system ${currentIndex + 1} — seed ${config.seed}\n`
      );
    }

    setGrowth(test, state.growth);
    const png = await renderFrame(modules, {
      config,
      eye: modules.orbitEye(state.azimuth, 0, options.distance),
      options: { ...options, flatten: state.flatten },
      test,
    });
    await writeFile(
      path.join(tmp, `frame-${String(frame).padStart(5, '0')}.png`),
      png
    );
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
  if (!MODES.includes(args.mode)) {
    throw new Error(`--mode must be one of ${MODES.join(', ')}`);
  }

  const ig = resolveIgPreset(args.ig);
  const options = {
    ...args,
    ig,
    version: await readPackageVersion(),
  };
  const out = path.resolve(REPO_ROOT, String(args.out));
  await mkdir(path.dirname(out), { recursive: true });

  const modules = await loadSceneModules();
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'rorschach-'));

  try {
    if (args.mode === 'stills') {
      const files = await renderStills(modules, { options, tmp });
      if (files.length === 0) throw new Error('no stills to stitch');

      process.stdout.write(
        `encoding ${files.length} stills at ${args.fps}fps\n`
      );
      if (args.crossfade > 0 && files.length > 1) {
        await encodeCrossfade(files, {
          crossfade: args.crossfade,
          fps: args.fps,
          hold: args.hold,
          out,
        });
      } else {
        await encodeCuts(files, { fps: args.fps, hold: args.hold, out, tmp });
      }
    } else {
      let totalFrames;
      if (args.mode === 'turntable') {
        totalFrames = await renderTurntable(modules, { options, tmp });
      } else {
        const cinematic = await import(
          `${REPO_ROOT}/src/components/scenes/WorkInProgress/WebGPU/Rorschach/utils/cinematic.js`
        );
        totalFrames = await renderCinematic(modules, {
          cinematic,
          options,
          tmp,
        });
      }
      await encodeFrames(tmp, { fps: args.fps, out, totalFrames });
    }

    process.stdout.write(`saved ${out}\n`);
  } finally {
    await disposeCapturers();
    await rm(tmp, { force: true, recursive: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
