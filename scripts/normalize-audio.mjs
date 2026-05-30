#!/usr/bin/env node

/**
 * normalize-audio.mjs
 *
 * Normalize the loudness of every audio file in a folder and convert
 * lossless sources (.wav/.flac/.aiff/.aif/.ogg/.m4a) to .mp3.
 *
 * Loudness target: EBU R128 two-pass `loudnorm` to -16 LUFS, -1.5 dBTP,
 * 11 LU range — a sensible default for short game/UI sound effects so every
 * clip sits at a consistent perceived volume.
 *
 * Originals are KEPT. Lossless sources are converted to a sibling .mp3.
 *
 * Idempotency: the script keeps a manifest (`.audio-normalized.json`) in the
 * folder recording the content hash of every output it has produced. On a
 * rerun, any file whose current hash is already in the manifest is skipped, so
 * only NEW or CHANGED files get processed — rerun it as often as you like
 * without re-encoding (and churning) audio that's already done. Use `--mark` to
 * seed the manifest from existing files without modifying them, or `--force` to
 * reprocess everything.
 *
 * Usage:
 *   node scripts/normalize-audio.mjs [folder] [options]
 *
 *   folder                Folder to process (default: public/audio/dumpsterfire)
 *   --target <LUFS>       Integrated loudness target   (default: -16)
 *   --tp <dBTP>           Max true peak                 (default: -1.5)
 *   --lra <LU>            Loudness range                (default: 11)
 *   --force               Reprocess every file, ignoring the manifest
 *   --mark                Record current files in the manifest WITHOUT changing
 *                         them (use to mark pre-normalized files as "done")
 *   --dry-run             Print what would happen, change nothing
 *   --recursive           Recurse into subfolders
 *
 * Examples:
 *   npm run audio:normalize
 *   npm run audio:normalize -- public/audio/someScene --target -14
 *   npm run audio:normalize -- --mark   # treat existing files as already done
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MANIFEST_NAME = '.audio-normalized.json';

const SOURCE_EXTENSIONS = new Set([
  '.wav',
  '.flac',
  '.aif',
  '.aiff',
  '.ogg',
  '.oga',
  '.m4a',
  '.mp3',
]);
const LOSSLESS_TO_MP3 = new Set([
  '.wav',
  '.flac',
  '.aif',
  '.aiff',
  '.ogg',
  '.oga',
  '.m4a',
]);

function parseArgs(argv) {
  const opts = {
    folder: 'public/audio/dumpsterfire',
    target: -16,
    tp: -1.5,
    lra: 11,
    force: false,
    mark: false,
    dryRun: false,
    recursive: false,
  };

  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--target':
        opts.target = Number(argv[(i += 1)]);
        break;
      case '--tp':
        opts.tp = Number(argv[(i += 1)]);
        break;
      case '--lra':
        opts.lra = Number(argv[(i += 1)]);
        break;
      case '--force':
        opts.force = true;
        break;
      case '--mark':
        opts.mark = true;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--recursive':
        opts.recursive = true;
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

async function collectAudioFiles(folder, recursive) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...(await collectAudioFiles(full, recursive)));
      }
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files.sort();
}

async function hashFile(file) {
  const buffer = await readFile(file);
  return createHash('sha1').update(buffer).digest('hex');
}

async function loadManifest(folder) {
  try {
    const raw = await readFile(path.join(folder, MANIFEST_NAME), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.files
      ? parsed
      : { target: null, files: {} };
  } catch {
    return { target: null, files: {} };
  }
}

async function saveManifest(folder, manifest) {
  await writeFile(
    path.join(folder, MANIFEST_NAME),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}

/** First-pass measurement so loudnorm can run in accurate (two-pass) mode. */
async function measure(file, opts) {
  const { stderr } = await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    file,
    '-af',
    `loudnorm=I=${opts.target}:TP=${opts.tp}:LRA=${opts.lra}:print_format=json`,
    '-f',
    'null',
    '-',
  ]);
  const match = stderr.match(/\{[\s\S]*?\}/);
  if (!match) {
    throw new Error(`Could not parse loudnorm measurement for ${file}`);
  }
  return JSON.parse(match[0]);
}

async function normalizeFile(file, opts, manifest, folder) {
  const ext = path.extname(file).toLowerCase();
  const dir = path.dirname(file);
  const base = path.basename(file, ext);
  const isMp3 = ext === '.mp3';
  const outPath = isMp3 ? file : path.join(dir, `${base}.mp3`);

  // Skip if this exact content was already processed (manifest hit).
  if (!opts.force) {
    const outRel = path.relative(folder, outPath);
    const recordedHash = manifest.files[outRel];
    if (recordedHash) {
      try {
        if ((await hashFile(outPath)) === recordedHash) {
          return { file, outPath, action: 'skipped', measuredI: NaN };
        }
      } catch {
        // output missing — fall through and (re)create it
      }
    }
  }

  const measured = await measure(file, opts);
  const measuredI = Number(measured.input_i);

  if (opts.dryRun) {
    return {
      file,
      outPath,
      action: LOSSLESS_TO_MP3.has(ext) ? 'would-convert' : 'would-normalize',
      measuredI,
    };
  }

  const tmpPath = path.join(dir, `.${base}.normalizing.mp3`);
  const loudnormFilter =
    `loudnorm=I=${opts.target}:TP=${opts.tp}:LRA=${opts.lra}:` +
    `measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:` +
    `measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:` +
    `offset=${measured.target_offset}:linear=true:print_format=summary`;

  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-y',
    '-i',
    file,
    '-af',
    loudnormFilter,
    '-ar',
    '44100',
    '-c:a',
    'libmp3lame',
    '-q:a',
    '2',
    tmpPath,
  ]);

  await rename(tmpPath, outPath);
  manifest.files[path.relative(folder, outPath)] = await hashFile(outPath);

  return {
    file,
    outPath,
    action: LOSSLESS_TO_MP3.has(ext) ? 'converted' : 'normalized',
    measuredI,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(
      [
        'Usage: node scripts/normalize-audio.mjs [folder] [options]',
        '  --target <LUFS>   integrated loudness target (default -16)',
        '  --tp <dBTP>       max true peak (default -1.5)',
        '  --lra <LU>        loudness range (default 11)',
        '  --force           reprocess every file, ignoring the manifest',
        '  --mark            record current files as done without changing them',
        '  --dry-run         show actions without writing',
        '  --recursive       recurse into subfolders',
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

  let folderStat;
  try {
    folderStat = await stat(opts.folder);
  } catch {
    console.error(`Error: folder not found: ${opts.folder}`);
    process.exitCode = 1;
    return;
  }
  if (!folderStat.isDirectory()) {
    console.error(`Error: not a folder: ${opts.folder}`);
    process.exitCode = 1;
    return;
  }

  const files = await collectAudioFiles(opts.folder, opts.recursive);
  if (files.length === 0) {
    console.log(`No audio files found in ${opts.folder}`);
    return;
  }

  const manifest = await loadManifest(opts.folder);

  // --mark: record current mp3 outputs as already-done, change nothing.
  if (opts.mark) {
    let marked = 0;
    for (const file of files) {
      if (path.extname(file).toLowerCase() !== '.mp3') {
        continue;
      }
      manifest.files[path.relative(opts.folder, file)] = await hashFile(file);
      marked += 1;
    }
    manifest.target = opts.target;
    await saveManifest(opts.folder, manifest);
    console.log(
      `Marked ${marked} existing mp3(s) as normalized in ${MANIFEST_NAME}`
    );
    return;
  }

  console.log(
    `Normalizing ${files.length} file(s) in ${opts.folder} ` +
      `to ${opts.target} LUFS / ${opts.tp} dBTP${opts.dryRun ? ' (dry run)' : ''}\n`
  );

  const summary = { converted: 0, normalized: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    const rel = path.relative(opts.folder, file);
    try {
      const result = await normalizeFile(file, opts, manifest, opts.folder);
      const measuredLabel = Number.isFinite(result.measuredI)
        ? `${result.measuredI.toFixed(1)} LUFS`
        : 'n/a';
      const verb = result.action.replace('would-', '→ ');
      console.log(`  ${verb.padEnd(11)} ${rel}  (was ${measuredLabel})`);
      if (result.action === 'converted' || result.action === 'would-convert') {
        summary.converted += 1;
      } else if (result.action === 'skipped') {
        summary.skipped += 1;
      } else {
        summary.normalized += 1;
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  FAILED      ${rel}: ${err.message}`);
    }
  }

  manifest.target = opts.target;
  if (!opts.dryRun) {
    await saveManifest(opts.folder, manifest);
  }

  console.log(
    `\nDone. converted=${summary.converted} normalized=${summary.normalized} ` +
      `skipped=${summary.skipped} failed=${summary.failed}`
  );
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
