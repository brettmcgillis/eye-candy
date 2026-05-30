#!/usr/bin/env node

/**
 * extract-sprites.mjs
 *
 * Derive Howler.js sprite timings from audio files that pack several clips
 * into one file (e.g. "*_sprites.mp3"). Uses ffmpeg `silencedetect` to find the
 * gaps between clips, then emits each clip as `[startMs, durationMs]` — the
 * shape Howler's `sprite` option expects.
 *
 * Usage:
 *   node scripts/extract-sprites.mjs [folder] [options]
 *
 *   folder                Folder to scan (default: public/audio/dumpsterfire)
 *   --pattern <substr>    Only files whose name includes this (default: sprite)
 *   --file <path>         Analyze a single file instead of scanning a folder
 *   --noise <dB>          Silence threshold, more negative = stricter (default: -40)
 *   --min-silence <sec>   Minimum gap to count as a split (default: 0.12)
 *   --min-clip <ms>       Drop detected clips shorter than this (default: 100)
 *   --pad <ms>            Extra ms added to each clip's tail (default: 40)
 *   --json <path>         Also write the full result object to this JSON file
 *
 * Output: prints, per file, a JS-ready sprite object you can paste into a
 * Howler config, plus a combined JSON blob.
 *
 * Examples:
 *   npm run audio:sprites
 *   npm run audio:sprites -- --file public/audio/dumpsterfire/empty_can_sprites.mp3
 */
import { execFile } from 'node:child_process';
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const opts = {
    folder: 'public/audio/dumpsterfire',
    pattern: 'sprite',
    file: null,
    noise: -40,
    minSilence: 0.12,
    minClip: 100,
    pad: 40,
    json: null,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--pattern':
        opts.pattern = argv[(i += 1)];
        break;
      case '--file':
        opts.file = argv[(i += 1)];
        break;
      case '--noise':
        opts.noise = Number(argv[(i += 1)]);
        break;
      case '--min-silence':
        opts.minSilence = Number(argv[(i += 1)]);
        break;
      case '--min-clip':
        opts.minClip = Number(argv[(i += 1)]);
        break;
      case '--pad':
        opts.pad = Number(argv[(i += 1)]);
        break;
      case '--json':
        opts.json = argv[(i += 1)];
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        positional.push(arg);
    }
  }
  if (positional[0]) {
    opts.folder = positional[0];
  }
  return opts;
}

async function getDuration(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    file,
  ]);
  return Number(stdout.trim());
}

/** Run silencedetect and return [{ start, end }] silence intervals in seconds. */
async function detectSilences(file, opts) {
  const { stderr } = await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    file,
    '-af',
    `silencedetect=noise=${opts.noise}dB:d=${opts.minSilence}`,
    '-f',
    'null',
    '-',
  ]);

  const silences = [];
  let current = null;
  for (const line of stderr.split('\n')) {
    const startMatch = line.match(/silence_start:\s*(-?[\d.]+)/);
    const endMatch = line.match(/silence_end:\s*(-?[\d.]+)/);
    if (startMatch) {
      current = { start: Math.max(0, Number(startMatch[1])) };
    } else if (endMatch && current) {
      current.end = Number(endMatch[1]);
      silences.push(current);
      current = null;
    }
  }
  // Trailing silence with no end (runs to EOF)
  if (current) {
    silences.push({ start: current.start, end: null });
  }
  return silences;
}

/** Invert silence intervals into sound segments across [0, duration]. */
function silencesToSegments(silences, duration) {
  const segments = [];
  let cursor = 0;
  for (const silence of silences) {
    if (silence.start > cursor) {
      segments.push({ start: cursor, end: silence.start });
    }
    cursor = silence.end == null ? duration : Math.max(cursor, silence.end);
  }
  if (cursor < duration) {
    segments.push({ start: cursor, end: duration });
  }
  return segments;
}

function camelBaseName(fileName) {
  const stem = path.basename(fileName, path.extname(fileName));
  const cleaned = stem.replace(/[_-]?sprites?$/i, '');
  const parts = cleaned.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length === 0) {
    return 'clip';
  }
  return parts
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}

async function analyzeFile(file, opts) {
  const duration = await getDuration(file);
  const silences = await detectSilences(file, opts);
  const allSegments = silencesToSegments(silences, duration);
  const minClipSec = opts.minClip / 1000;
  const segments = allSegments.filter(
    (segment) => segment.end - segment.start >= minClipSec
  );

  const base = camelBaseName(file);
  const sprites = {};
  const clipKeys = [];
  segments.forEach((segment, index) => {
    const key = `${base}${index + 1}`;
    const startMs = Math.max(0, Math.round(segment.start * 1000));
    const endMs = Math.round(segment.end * 1000) + opts.pad;
    const durationMs = Math.max(1, endMs - startMs);
    sprites[key] = [startMs, durationMs];
    clipKeys.push(key);
  });

  return {
    file,
    base,
    durationMs: Math.round(duration * 1000),
    sprites,
    clipKeys,
  };
}

async function collectFiles(opts) {
  if (opts.file) {
    return [opts.file];
  }
  const entries = await readdir(opts.folder, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(
      (name) =>
        /\.(mp3|wav|flac|ogg|m4a|aif|aiff)$/i.test(name) &&
        name.toLowerCase().includes(opts.pattern.toLowerCase())
    )
    .sort()
    .map((name) => path.join(opts.folder, name));
}

function printResult(result) {
  const relName = path.basename(result.file);
  console.log(
    `\n// ${relName}  (${result.clipKeys.length} clips, ${result.durationMs}ms)`
  );
  console.log('sprites: {');
  for (const key of result.clipKeys) {
    const [start, dur] = result.sprites[key];
    console.log(`  ${key}: [${start}, ${dur}],`);
  }
  console.log('},');
  console.log(
    `clipKeys: [${result.clipKeys.map((k) => `'${k}'`).join(', ')}],`
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(
      [
        'Usage: node scripts/extract-sprites.mjs [folder] [options]',
        '  --pattern <substr>   only files containing this (default sprite)',
        '  --file <path>        analyze a single file',
        '  --noise <dB>         silence threshold (default -40)',
        '  --min-silence <sec>  min gap to split (default 0.12)',
        '  --min-clip <ms>      drop clips shorter than this (default 100)',
        '  --pad <ms>           tail padding per clip (default 40)',
        '  --json <path>        write combined result JSON',
      ].join('\n')
    );
    return;
  }

  try {
    await execFileAsync('ffmpeg', ['-version']);
  } catch {
    console.error('Error: ffmpeg not found on PATH. Install ffmpeg and retry.');
    process.exitCode = 1;
    return;
  }

  if (!opts.file) {
    try {
      const folderStat = await stat(opts.folder);
      if (!folderStat.isDirectory()) {
        throw new Error('not a folder');
      }
    } catch {
      console.error(`Error: folder not found: ${opts.folder}`);
      process.exitCode = 1;
      return;
    }
  }

  const files = await collectFiles(opts);
  if (files.length === 0) {
    console.log(
      `No matching files (pattern "${opts.pattern}") in ${opts.file ?? opts.folder}`
    );
    return;
  }

  console.log(
    `Extracting sprite timings from ${files.length} file(s) ` +
      `(noise=${opts.noise}dB, min-silence=${opts.minSilence}s, pad=${opts.pad}ms)`
  );

  const combined = {};
  for (const file of files) {
    try {
      const result = await analyzeFile(file, opts);
      printResult(result);
      combined[path.basename(file)] = {
        durationMs: result.durationMs,
        sprites: result.sprites,
        clipKeys: result.clipKeys,
      };
    } catch (err) {
      console.error(`  FAILED ${path.basename(file)}: ${err.message}`);
    }
  }

  if (opts.json) {
    await writeFile(opts.json, JSON.stringify(combined, null, 2));
    console.log(`\nWrote ${opts.json}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
