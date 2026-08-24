import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const jobs = new Map();
const MAX_LOG_LINES = 160;
const OUTPUT_ROOT = path.join('output', 'rorschach-workbench', 'jobs');

export class RorschachRequestError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'RorschachRequestError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function numberOption(value, fallback, { max, min }) {
  const result = value === '' || value == null ? fallback : Number(value);
  if (!Number.isFinite(result) || result < min || result > max) {
    throw new RorschachRequestError(
      400,
      'INVALID_OPTION',
      `Expected a number between ${min} and ${max}.`
    );
  }
  return result;
}

function choiceOption(value, fallback, choices, label) {
  const result = String(value ?? fallback);
  if (!choices.includes(result)) {
    throw new RorschachRequestError(
      400,
      'INVALID_OPTION',
      `${label} must be one of ${choices.join(', ')}.`
    );
  }
  return result;
}

function normalizeShared(raw = {}) {
  return {
    bloom: raw.bloom !== false,
    bloomRadius: numberOption(raw.bloomRadius, 0.3, { min: 0, max: 1 }),
    bloomStrength: numberOption(raw.bloomStrength, 0.5, {
      min: 0,
      max: 10,
    }),
    bloomThreshold: numberOption(raw.bloomThreshold, 1, {
      min: 0,
      max: 10,
    }),
    distance: numberOption(raw.distance, 22, { min: 1, max: 200 }),
    flatten: numberOption(raw.flatten, 0, { min: 0, max: 1 }),
    flattenAxis: choiceOption(raw.flattenAxis, 'z', ['z', 'y'], 'flattenAxis'),
    height: numberOption(raw.height, 1080, { min: 64, max: 8192 }),
    ig: choiceOption(raw.ig, 'post', ['post', 'story', 'reel', 'none'], 'ig'),
    overlay: Boolean(raw.overlay),
    renderer: choiceOption(raw.renderer, 'gpu', ['gpu', 'svg'], 'renderer'),
    seed:
      raw.seed === '' || raw.seed == null
        ? null
        : numberOption(raw.seed, null, { min: 0, max: 999999 }),
    width: numberOption(raw.width, 1080, { min: 64, max: 8192 }),
  };
}

function normalizeOptions(kind, raw) {
  const shared = normalizeShared(raw);
  if (kind === 'still') {
    return {
      ...shared,
      count: numberOption(raw.count, 1, { min: 1, max: 100 }),
      fov: numberOption(raw.fov, 42, { min: 1, max: 179 }),
      simplify: numberOption(raw.simplify, 0.4, { min: 0, max: 20 }),
      views: choiceOption(
        raw.views,
        'front,back,top,bottom',
        [
          'front',
          'back',
          'top',
          'bottom',
          'front,back,top,bottom',
        ],
        'views'
      ),
    };
  }

  return {
    ...shared,
    count: numberOption(raw.count, 6, { min: 1, max: 100 }),
    crossfade: numberOption(raw.crossfade, 0.5, { min: 0, max: 30 }),
    fps: numberOption(raw.fps, 30, { min: 1, max: 120 }),
    hold: numberOption(raw.hold, 2, { min: 0.1, max: 120 }),
    mode: choiceOption(
      raw.mode,
      'stills',
      ['stills', 'turntable', 'cinematic'],
      'mode'
    ),
    systems: numberOption(raw.systems, 3, { min: 1, max: 100 }),
    turns: numberOption(raw.turns, 1, { min: 0.1, max: 100 }),
    view: choiceOption(
      raw.view,
      'front',
      ['front', 'back', 'top', 'bottom'],
      'view'
    ),
  };
}

function appendFlags(args, options) {
  Object.entries(options).forEach(([key, value]) => {
    if (value == null) return;
    if (typeof value === 'boolean') {
      args.push(value ? `--${key}` : `--no-${key}`);
      return;
    }
    args.push(`--${key}`, String(value));
  });
}

function publicJob(job) {
  const { child, pendingOutput, ...result } = job;
  return result;
}

function addLog(job, source, message) {
  String(message)
    .split(/\r?\n/u)
    .map((line) => line.replace(/\x1b\[[0-9;]*[A-Za-z]/gu, '').trim())
    .filter(Boolean)
    .forEach((line) => {
      job.logs.push({ source, text: line, time: new Date().toISOString() });
      job.logs.splice(0, Math.max(0, job.logs.length - MAX_LOG_LINES));

      const batch = line.match(/^\[(\d+)\/(\d+)\]/u);
      const percent = line.match(/(?:rendering|encoding)\s+(\d+)%/u);
      if (batch) {
        job.phase = 'rendering';
        job.progress = Math.round(((Number(batch[1]) - 1) / Number(batch[2])) * 90);
      } else if (percent) {
        const amount = Number(percent[1]);
        job.phase = line.includes('encoding') ? 'encoding' : 'rendering';
        job.progress =
          job.phase === 'encoding'
            ? 80 + Math.round(amount * 0.2)
            : Math.round(amount * 0.8);
      } else if (line.startsWith('encoding')) {
        job.phase = 'encoding';
        job.progress = Math.max(job.progress, 80);
      }
    });
}

async function discoverAssets(rootDir, job) {
  const outputDir = path.resolve(rootDir, job.outputDirectory);
  const assets = [];

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(target);
        } else {
          const relativePath = path.relative(outputDir, target).split(path.sep).join('/');
          assets.push({
            name: entry.name,
            path: relativePath,
            url: `/dev-api/rorschach/jobs/${job.id}/assets/${relativePath
              .split('/')
              .map(encodeURIComponent)
              .join('/')}`,
          });
        }
      })
    );
  }

  try {
    await walk(outputDir);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return assets.sort((left, right) => left.path.localeCompare(right.path));
}

export function createRorschachJob(rootDir, payload = {}) {
  const kind = choiceOption(payload.kind, 'still', ['still', 'video'], 'kind');
  const options = normalizeOptions(kind, payload.options ?? {});
  const id = randomUUID();
  const outputDirectory = path.join(OUTPUT_ROOT, id);
  const script = kind === 'still' ? 'rorschach-generate.mjs' : 'rorschach-video.mjs';
  const args = [path.join(rootDir, 'scripts', script)];
  const commandOptions = { ...options };

  if (kind === 'still') {
    commandOptions.out = outputDirectory;
  } else {
    commandOptions.out = path.join(outputDirectory, 'rorschach.mp4');
  }
  appendFlags(args, commandOptions);

  const job = {
    assets: [],
    child: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    error: null,
    id,
    kind,
    logs: [],
    options,
    outputDirectory,
    phase: 'queued',
    pendingOutput: '',
    progress: 0,
    status: 'queued',
  };
  jobs.set(id, job);

  const child = spawn(process.execPath, args, { cwd: rootDir });
  job.child = child;
  job.phase = 'starting';
  job.status = 'running';

  child.stdout.on('data', (chunk) => addLog(job, 'stdout', chunk));
  child.stderr.on('data', (chunk) => addLog(job, 'stderr', chunk));
  child.on('error', (error) => {
    job.error = error.message;
  });
  child.on('close', async (code, signal) => {
    job.child = null;
    job.completedAt = new Date().toISOString();
    job.assets = await discoverAssets(rootDir, job);
    if (job.status === 'cancelling') {
      job.phase = 'cancelled';
      job.status = 'cancelled';
      return;
    }
    if (code === 0) {
      job.phase = 'complete';
      job.progress = 100;
      job.status = 'completed';
      return;
    }
    job.error = job.error ?? `Generator exited with code ${code ?? 'null'}${
      signal ? ` (${signal})` : ''
    }.`;
    job.phase = 'failed';
    job.status = 'failed';
  });

  return publicJob(job);
}

export function listRorschachJobs() {
  return [...jobs.values()]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(publicJob);
}

export function getRorschachJob(id) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(404, 'JOB_NOT_FOUND', 'Render job not found.');
  }
  return publicJob(job);
}

export function cancelRorschachJob(id) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(404, 'JOB_NOT_FOUND', 'Render job not found.');
  }
  if (job.status !== 'running' || !job.child) return publicJob(job);
  job.phase = 'cancelling';
  job.status = 'cancelling';
  job.child.kill('SIGTERM');
  return publicJob(job);
}

export function resolveRorschachAsset(rootDir, id, relativePath) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(404, 'JOB_NOT_FOUND', 'Render job not found.');
  }
  const outputDir = path.resolve(rootDir, job.outputDirectory);
  const target = path.resolve(outputDir, relativePath);
  const relative = path.relative(outputDir, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new RorschachRequestError(400, 'INVALID_ASSET_PATH', 'Invalid asset path.');
  }
  return target;
}