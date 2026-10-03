#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { SIZE_FILTER } from './lib/frameSink.mjs';
import { writeVideoSidecar } from './lib/videoMetadata.mjs';

// Darkroom renders in the browser; this only turns the frames it staged into
// a collection: an mp4 (with the source clip's audio) or stills.
const { values: args } = parseArgs({
  options: {
    audio: { type: 'string' },
    audioStart: { default: '0', type: 'string' },
    fps: { default: '30', type: 'string' },
    frames: { type: 'string' },
    kind: { default: 'video', type: 'string' },
    name: { default: 'darkroom', type: 'string' },
    out: { type: 'string' },
    recipe: { default: '{}', type: 'string' },
  },
});

const recipe = JSON.parse(args.recipe);
const fps = Number(args.fps);

async function frameFiles() {
  return (await readdir(args.frames))
    .filter((name) => /^frame-\d{5}\.png$/u.test(name))
    .sort();
}

function encode(total, out) {
  const input = [
    '-framerate',
    String(fps),
    '-start_number',
    '0',
    '-i',
    path.join(args.frames, 'frame-%05d.png'),
  ];
  const audio = args.audio
    ? ['-ss', args.audioStart, '-i', args.audio, '-map', '0:v', '-map', '1:a?']
    : [];
  const audioCodec = args.audio
    ? ['-c:a', 'aac', '-b:a', '192k', '-shortest']
    : [];
  return new Promise((resolve, reject) => {
    const child = spawn(
      'ffmpeg',
      [
        '-y',
        ...input,
        ...audio,
        '-vf',
        `${SIZE_FILTER},format=yuv420p`,
        '-c:v',
        'libx264',
        '-crf',
        '17',
        '-preset',
        'slow',
        ...audioCodec,
        '-movflags',
        '+faststart',
        out,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    let stderr = '';
    let reported = -1;
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const frames = [...String(chunk).matchAll(/frame=\s*(\d+)/gu)];
      if (!frames.length) return;
      const percent = Math.min(
        99,
        Math.floor((Number(frames.at(-1)[1]) / total) * 100)
      );
      if (percent >= reported + 5) {
        reported = percent;
        process.stdout.write(`encoding ${percent}%\n`);
      }
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`))
    );
  });
}

async function writeVideo(files) {
  const out = path.join(args.out, `${args.name}.mp4`);
  await mkdir(args.out, { recursive: true });
  await encode(files.length, out);
  await writeVideoSidecar(out, {
    presets: recipe.options,
    render: { fps, frames: files.length, technique: recipe.technique },
    source: recipe.source,
    technique: recipe.technique,
  });
  process.stdout.write(`encoding 100%\n`);
}

async function writeStills(files) {
  await Promise.all(
    files.map(async (file, index) => {
      const directory = path.join(
        args.out,
        `${args.name}-${String(index + 1).padStart(2, '0')}`
      );
      await mkdir(directory, { recursive: true });
      await copyFile(
        path.join(args.frames, file),
        path.join(directory, 'still.png')
      );
      await writeFile(
        path.join(directory, 'props.json'),
        `${JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            preset: recipe.options,
            render: { technique: recipe.technique },
            source: recipe.source,
            technique: recipe.technique,
          },
          null,
          2
        )}\n`
      );
      process.stdout.write(`[${index + 1}/${files.length}] ${directory}\n`);
    })
  );
}

try {
  const files = await frameFiles();
  if (files.length === 0) throw new Error('No frames were staged.');
  if (args.kind === 'still') await writeStills(files);
  else await writeVideo(files);
  await rm(args.frames, { force: true, recursive: true });
} catch (error) {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
}
