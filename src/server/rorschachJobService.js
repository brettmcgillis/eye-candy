import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const jobs = new Map();
const MAX_LOG_LINES = 160;
const OUTPUT_ROOT = path.join('output', 'rorschach-workbench', 'jobs');
const LEGACY_OUTPUT_ROOT = path.join('output', 'batch');
const MANIFEST_FILE = 'manifest.json';
const MANIFEST_VERSION = 1;
const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'failed']);

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
      svg: Boolean(raw.svg),
      views: choiceOption(
        raw.views,
        'front,back,top,bottom',
        ['front', 'back', 'top', 'bottom', 'front,back,top,bottom'],
        'views'
      ),
      webp: Boolean(raw.webp),
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
  const result = { ...job };
  delete result.child;
  return result;
}

function assertCollectionDirectory(rootDir, outputRoot, collectionName) {
  const approvedRoot = path.resolve(rootDir, outputRoot);
  const outputDir = path.resolve(approvedRoot, collectionName);
  if (
    path.dirname(outputDir) !== approvedRoot ||
    outputDir === approvedRoot ||
    !collectionName
  ) {
    throw new RorschachRequestError(
      400,
      'INVALID_COLLECTION_PATH',
      'Invalid output collection path.'
    );
  }
  return outputDir;
}

function manifestFor(job) {
  const manifest = publicJob(job);
  delete manifest.assets;
  delete manifest.storageBytes;
  return { ...manifest, manifestVersion: MANIFEST_VERSION };
}

async function persistJob(rootDir, job) {
  if (job.source !== 'workbench') return;
  const outputDir = assertCollectionDirectory(rootDir, OUTPUT_ROOT, job.id);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, MANIFEST_FILE),
    `${JSON.stringify(manifestFor(job), null, 2)}\n`
  );
}

function addLog(job, source, message) {
  const currentJob = job;
  String(message)
    .split(/\r?\n/u)
    .map((line) => line.replaceAll('\u001b[K', '').trim())
    .filter(Boolean)
    .forEach((line) => {
      currentJob.logs.push({
        source,
        text: line,
        time: new Date().toISOString(),
      });
      currentJob.logs.splice(
        0,
        Math.max(0, currentJob.logs.length - MAX_LOG_LINES)
      );

      const batch = line.match(/^\[(\d+)\/(\d+)\]/u);
      const percent = line.match(/(?:rendering|encoding)\s+(\d+)%/u);
      if (batch) {
        currentJob.phase = 'rendering';
        currentJob.progress = Math.round(
          ((Number(batch[1]) - 1) / Number(batch[2])) * 90
        );
      } else if (percent) {
        const amount = Number(percent[1]);
        currentJob.phase = line.includes('encoding') ? 'encoding' : 'rendering';
        currentJob.progress =
          currentJob.phase === 'encoding'
            ? 80 + Math.round(amount * 0.2)
            : Math.round(amount * 0.8);
      } else if (line.startsWith('encoding')) {
        currentJob.phase = 'encoding';
        currentJob.progress = Math.max(currentJob.progress, 80);
      }
    });
}

async function discoverAssets(rootDir, job) {
  const outputDir = path.resolve(rootDir, job.outputDirectory);
  const assets = [];
  let storageBytes = 0;

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(target);
        } else if (entry.name !== MANIFEST_FILE) {
          const stats = await fs.stat(target);
          const relativePath = path
            .relative(outputDir, target)
            .split(path.sep)
            .join('/');
          storageBytes += stats.size;
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
  return {
    assets: assets.sort((left, right) => left.path.localeCompare(right.path)),
    storageBytes,
  };
}

async function readManifest(outputDir) {
  try {
    return JSON.parse(await fs.readFile(path.join(outputDir, MANIFEST_FILE)));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function discoverCollections(rootDir, outputRoot, source) {
  const approvedRoot = path.resolve(rootDir, outputRoot);
  let entries;
  try {
    entries = await fs.readdir(approvedRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const outputDir = assertCollectionDirectory(
          rootDir,
          outputRoot,
          entry.name
        );
        const manifest =
          source === 'workbench' ? await readManifest(outputDir) : null;
        const id = source === 'workbench' ? entry.name : `batch-${entry.name}`;
        const existing = jobs.get(id);
        const stats = await fs.stat(outputDir);
        const interrupted =
          !existing?.child &&
          ['cancelling', 'queued', 'running'].includes(manifest?.status);
        const job = existing ?? {
          completedAt: stats.mtime.toISOString(),
          createdAt: stats.birthtime.toISOString(),
          error: null,
          id,
          kind: source === 'workbench' ? (manifest?.kind ?? 'still') : 'legacy',
          logs: [],
          options: manifest?.options ?? {},
          outputDirectory: path.relative(rootDir, outputDir),
          phase: manifest?.phase ?? 'complete',
          progress: manifest?.progress ?? 100,
          status: manifest?.status ?? 'completed',
        };
        if (!existing && manifest) Object.assign(job, manifest);
        Object.assign(job, {
          child: existing?.child ?? null,
          id,
          source,
        });
        if (interrupted) {
          job.completedAt = new Date().toISOString();
          job.error = 'Render interrupted when the development server stopped.';
          job.phase = 'interrupted';
          job.status = 'failed';
          await persistJob(rootDir, job);
        }
        Object.assign(job, await discoverAssets(rootDir, job));
        jobs.set(id, job);
        return job;
      })
  );
}

export async function createRorschachJob(rootDir, payload = {}) {
  const kind = choiceOption(payload.kind, 'still', ['still', 'video'], 'kind');
  const options = normalizeOptions(kind, payload.options ?? {});
  const id = randomUUID();
  const outputDirectory = path.join(OUTPUT_ROOT, id);
  const script =
    kind === 'still' ? 'rorschach-generate.mjs' : 'rorschach-video.mjs';
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
    progress: 0,
    source: 'workbench',
    status: 'queued',
  };
  jobs.set(id, job);
  await persistJob(rootDir, job);

  const child = spawn(process.execPath, args, { cwd: rootDir });
  job.child = child;
  job.phase = 'starting';
  job.status = 'running';
  await persistJob(rootDir, job);

  child.stdout.on('data', (chunk) => addLog(job, 'stdout', chunk));
  child.stderr.on('data', (chunk) => addLog(job, 'stderr', chunk));
  child.on('error', (error) => {
    job.error = error.message;
  });
  child.on('close', async (code, signal) => {
    job.child = null;
    job.completedAt = new Date().toISOString();
    Object.assign(job, await discoverAssets(rootDir, job));
    if (job.status === 'cancelling') {
      job.phase = 'cancelled';
      job.status = 'cancelled';
      await persistJob(rootDir, job);
      return;
    }
    if (code === 0) {
      job.phase = 'complete';
      job.progress = 100;
      job.status = 'completed';
      await persistJob(rootDir, job);
      return;
    }
    job.error =
      job.error ??
      `Generator exited with code ${code ?? 'null'}${
        signal ? ` (${signal})` : ''
      }.`;
    job.phase = 'failed';
    job.status = 'failed';
    await persistJob(rootDir, job);
  });

  return publicJob(job);
}

export async function listRorschachJobs(rootDir) {
  const collections = (
    await Promise.all([
      discoverCollections(rootDir, OUTPUT_ROOT, 'workbench'),
      discoverCollections(rootDir, LEGACY_OUTPUT_ROOT, 'legacy'),
    ])
  ).flat();
  const discoveredIds = new Set(collections.map((job) => job.id));
  jobs.forEach((job, id) => {
    if (!job.child && !discoveredIds.has(id)) jobs.delete(id);
  });
  return collections
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(publicJob);
}

export function getRorschachJob(id) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(
      404,
      'JOB_NOT_FOUND',
      'Render job not found.'
    );
  }
  return publicJob(job);
}

export async function cancelRorschachJob(rootDir, id) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(
      404,
      'JOB_NOT_FOUND',
      'Render job not found.'
    );
  }
  if (job.status !== 'running' || !job.child) return publicJob(job);
  job.phase = 'cancelling';
  job.status = 'cancelling';
  job.child.kill('SIGTERM');
  await persistJob(rootDir, job);
  return publicJob(job);
}

function deletableCollection(rootDir, id, confirmedOutputDirectory) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(
      404,
      'JOB_NOT_FOUND',
      'Output collection not found.'
    );
  }
  if (!TERMINAL_STATUSES.has(job.status) || job.child) {
    throw new RorschachRequestError(
      409,
      'COLLECTION_ACTIVE',
      'Cancel the active render before deleting its output.'
    );
  }
  if (confirmedOutputDirectory !== job.outputDirectory) {
    throw new RorschachRequestError(
      400,
      'DELETE_CONFIRMATION_MISMATCH',
      'Output directory confirmation does not match the collection.'
    );
  }
  const outputRoot = job.source === 'legacy' ? LEGACY_OUTPUT_ROOT : OUTPUT_ROOT;
  const collectionName =
    job.source === 'legacy' ? id.replace(/^batch-/u, '') : id;
  const outputDir = assertCollectionDirectory(
    rootDir,
    outputRoot,
    collectionName
  );
  return { job, outputDir };
}

export async function deleteRorschachCollection(
  rootDir,
  id,
  confirmedOutputDirectory
) {
  const { outputDir } = deletableCollection(
    rootDir,
    id,
    confirmedOutputDirectory
  );
  await fs.rm(outputDir, { recursive: true });
  jobs.delete(id);
  return { id };
}

export async function deleteRorschachCollections(rootDir, collections) {
  if (!Array.isArray(collections) || collections.length === 0) {
    throw new RorschachRequestError(
      400,
      'INVALID_COLLECTIONS',
      'Select at least one output collection.'
    );
  }
  if (collections.length > 100) {
    throw new RorschachRequestError(
      400,
      'TOO_MANY_COLLECTIONS',
      'Delete at most 100 output collections at once.'
    );
  }
  const unique = new Map(
    collections.map((collection) => [collection.id, collection])
  );
  const targets = [...unique.values()].map((collection) => ({
    id: collection.id,
    ...deletableCollection(rootDir, collection.id, collection.outputDirectory),
  }));
  await Promise.all(
    targets.map(({ outputDir }) => fs.rm(outputDir, { recursive: true }))
  );
  targets.forEach(({ id }) => jobs.delete(id));
  return { ids: targets.map(({ id }) => id) };
}

export async function deleteRorschachAssets(
  rootDir,
  id,
  confirmedOutputDirectory,
  relativePaths
) {
  const { job, outputDir } = deletableCollection(
    rootDir,
    id,
    confirmedOutputDirectory
  );
  if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
    throw new RorschachRequestError(
      400,
      'INVALID_ASSETS',
      'Select at least one output item.'
    );
  }
  if (relativePaths.length > 500) {
    throw new RorschachRequestError(
      400,
      'TOO_MANY_ASSETS',
      'Delete at most 500 files at once.'
    );
  }
  const indexedPaths = new Set(job.assets.map((asset) => asset.path));
  const paths = [...new Set(relativePaths)];
  const targets = paths.map((relativePath) => {
    if (typeof relativePath !== 'string' || !indexedPaths.has(relativePath)) {
      throw new RorschachRequestError(
        400,
        'ASSET_NOT_INDEXED',
        'Output item is not part of this collection.'
      );
    }
    const target = path.resolve(outputDir, relativePath);
    const relative = path.relative(outputDir, target);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new RorschachRequestError(
        400,
        'INVALID_ASSET_PATH',
        'Invalid asset path.'
      );
    }
    return target;
  });
  await Promise.all(targets.map((target) => fs.rm(target, { force: true })));
  Object.assign(job, await discoverAssets(rootDir, job));
  await persistJob(rootDir, job);
  return publicJob(job);
}

export function resolveRorschachAsset(rootDir, id, relativePath) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(
      404,
      'JOB_NOT_FOUND',
      'Render job not found.'
    );
  }
  const outputDir = path.resolve(rootDir, job.outputDirectory);
  const target = path.resolve(outputDir, relativePath);
  const relative = path.relative(outputDir, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new RorschachRequestError(
      400,
      'INVALID_ASSET_PATH',
      'Invalid asset path.'
    );
  }
  return target;
}
