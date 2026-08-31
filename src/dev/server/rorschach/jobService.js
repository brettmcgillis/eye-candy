import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Relative rather than `@modules/rorschach`: this runs inside Vite's config
// loader, which doesn't resolve the app's path aliases. renderOptions.mjs is
// dependency-free so it can be reached this way — see
// docs/rorschach-pipeline.md.
import {
  RENDER_OPTIONS,
  normalizeOptions as normalizeRenderOptions,
} from '../../../modules/rorschach/renderOptions.mjs';

const jobs = new Map();
const MAX_LOG_LINES = 160;
const OUTPUT_ROOT = path.join('output', 'rorschach-workbench', 'jobs');
const LEGACY_OUTPUT_ROOT = path.join('output', 'batch');
const CURATED_ROOT = path.join('public', 'images', 'rorschach');
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

// Validation lives in the kernel's option schema, so the workbench can't offer
// a value the CLI would reject and the two can't drift on a range. Only the
// error type is local: the workbench needs a typed 400, not a bare Error.
function normalizeOptions(kind, raw) {
  return normalizeRenderOptions(kind, raw, {
    fail: (message) =>
      new RorschachRequestError(400, 'INVALID_OPTION', message),
    surface: 'workbench',
  });
}

// A rollable option is only forwarded when the caller actually chose it.
//
// The CLI reads an explicitly typed flag as a pin, so emitting every key —
// which is what normalizeOptions leaves behind once defaults are merged — pins
// the entire test and makes rolling impossible from the workbench. Everything
// with no `facet` is a render setting the dice never touch, and is always
// passed through.
function appendFlags(args, options, chosen) {
  Object.entries(options).forEach(([key, value]) => {
    if (value == null) return;
    if (RENDER_OPTIONS[key]?.facet && !chosen.has(key)) return;
    if (typeof value === 'boolean') {
      args.push(value ? `--${key}` : `--no-${key}`);
      return;
    }
    // A json-typed option carries an object, and `String()` on one is
    // "[object Object]" — a flag the CLI accepts and then silently ignores.
    args.push(
      `--${key}`,
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    );
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
      // The bar labels itself after what it is counting — "rendering growth",
      // "rendering views", "encoding" — so the words between the verb and the
      // number vary. Matching only `rendering %` meant a video job sat at zero
      // for its entire render and only moved during the encode.
      const percent = line.match(/^(rendering|encoding)\b[^%]*?(\d+)%/u);
      if (batch) {
        currentJob.phase = 'rendering';
        currentJob.progress = Math.round(
          ((Number(batch[1]) - 1) / Number(batch[2])) * 90
        );
      } else if (percent) {
        const amount = Number(percent[2]);
        currentJob.phase = percent[1] === 'encoding' ? 'encoding' : 'rendering';
        currentJob.progress =
          currentJob.phase === 'encoding'
            ? 90 + Math.round(amount * 0.1)
            : Math.round(amount * 0.9);
      } else if (line.startsWith('finishing encode')) {
        // Frames are piped into ffmpeg as they render, so there is no separate
        // encoding pass to count — only the tail once the last frame is in.
        currentJob.phase = 'encoding';
        currentJob.progress = Math.max(currentJob.progress, 92);
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
            size: stats.size,
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

export async function listCuratedRorschachCollections(rootDir) {
  const curatedRoot = path.resolve(rootDir, CURATED_ROOT);
  const collections = new Map();

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(target);
          return;
        }

        const relativePath = path.relative(curatedRoot, target);
        if (
          !/\.(mp4|png|svg|webp)$/u.test(relativePath) &&
          !relativePath.endsWith('.json')
        ) {
          return;
        }
        const segments = relativePath.split(path.sep);
        const collectionName = segments.length > 1 ? segments.shift() : 'saved';
        const assetPath = segments.join('/');
        const stats = await fs.stat(target);
        const collection = collections.get(collectionName) ?? {
          assets: [],
          completedAt: stats.mtime.toISOString(),
          createdAt: stats.birthtime.toISOString(),
          error: null,
          id: `curated-${collectionName}`,
          kind: 'still',
          logs: [],
          options: {},
          outputDirectory: path.join(CURATED_ROOT, collectionName),
          phase: 'saved',
          progress: 100,
          source: 'curated',
          status: 'completed',
          storageBytes: 0,
        };
        collection.assets.push({
          name: entry.name,
          path: assetPath,
          size: stats.size,
          url: `/images/rorschach/${relativePath
            .split(path.sep)
            .map(encodeURIComponent)
            .join('/')}`,
        });
        collection.storageBytes += stats.size;
        if (stats.mtime.toISOString() > collection.completedAt) {
          collection.completedAt = stats.mtime.toISOString();
        }
        collections.set(collectionName, collection);
      })
    );
  }

  try {
    await walk(curatedRoot);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  return [...collections.values()]
    .map((collection) => ({
      ...collection,
      assets: collection.assets.sort((left, right) =>
        left.path.localeCompare(right.path)
      ),
    }))
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt));
}

export async function deleteCuratedRorschachAssets(
  rootDir,
  confirmedOutputDirectory,
  relativePaths
) {
  if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
    throw new RorschachRequestError(
      400,
      'INVALID_ASSETS',
      'Select at least one saved image.'
    );
  }
  if (relativePaths.length > 500) {
    throw new RorschachRequestError(
      400,
      'TOO_MANY_ASSETS',
      'Delete at most 500 saved images at once.'
    );
  }

  const curatedRoot = path.resolve(rootDir, CURATED_ROOT);
  const outputDir = path.resolve(rootDir, confirmedOutputDirectory);
  if (path.dirname(outputDir) !== curatedRoot || outputDir === curatedRoot) {
    throw new RorschachRequestError(
      400,
      'INVALID_CURATED_COLLECTION',
      'Invalid saved collection path.'
    );
  }

  const targets = [...new Set(relativePaths)].map((relativePath) => {
    if (
      typeof relativePath !== 'string' ||
      !/\.(mp4|png|svg|webp)$/u.test(relativePath)
    ) {
      throw new RorschachRequestError(
        400,
        'ASSET_NOT_CURATABLE',
        'Select a saved image to delete.'
      );
    }
    const target = path.resolve(outputDir, relativePath);
    const relative = path.relative(outputDir, target);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new RorschachRequestError(
        400,
        'INVALID_ASSET_PATH',
        'Invalid saved image path.'
      );
    }
    return target;
  });

  const videoMetadataTargets = targets
    .filter((target) => target.endsWith('.mp4'))
    .map((target) => target.replace(/\.mp4$/u, '.json'));
  await Promise.all(
    [...targets, ...videoMetadataTargets].map((target) =>
      fs.rm(target, { force: true })
    )
  );
  const affectedDirectories = new Set(
    targets.map((target) => path.dirname(target))
  );
  await Promise.all(
    [...affectedDirectories].map(async (directory) => {
      const entries = await fs.readdir(directory).catch((error) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      });
      if (!entries.some((entry) => /\.(png|svg|webp)$/u.test(entry))) {
        await fs.rm(path.join(directory, 'props.json'), { force: true });
      }
    })
  );
  return listCuratedRorschachCollections(rootDir);
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
  const kind = payload.kind ?? 'still';
  if (kind !== 'still' && kind !== 'video') {
    throw new RorschachRequestError(
      400,
      'INVALID_OPTION',
      'kind must be one of still, video.'
    );
  }
  const options = normalizeOptions(kind, payload.options ?? {});
  // Read before defaults were merged in — the keys the workbench actually sent
  // are the pins.
  const chosen = new Set(Object.keys(payload.options ?? {}));
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
    if (['growth', 'stills'].includes(options.mode) && options.keepImages) {
      commandOptions.stillsOut = path.join(outputDirectory, 'stills');
    }
    delete commandOptions.keepImages;
  }
  appendFlags(args, commandOptions, new Set([...chosen, 'out', 'stillsOut']));

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
  const metadataTargets = paths
    .filter((relativePath) => relativePath.endsWith('.mp4'))
    .map((relativePath) =>
      path.resolve(outputDir, relativePath.replace(/\.mp4$/u, '.json'))
    );
  await Promise.all(
    [...targets, ...metadataTargets].map((target) =>
      fs.rm(target, { force: true })
    )
  );
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

export async function keepRorschachAssets(rootDir, id, relativePaths) {
  const job = jobs.get(id);
  if (!job) {
    throw new RorschachRequestError(
      404,
      'JOB_NOT_FOUND',
      'Render job not found.'
    );
  }
  if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
    throw new RorschachRequestError(
      400,
      'ASSET_NOT_CURATABLE',
      'Select at least one generated image to keep.'
    );
  }
  const paths = [...new Set(relativePaths)];
  const assets = paths.map((relativePath) => {
    const asset = job.assets.find((item) => item.path === relativePath);
    if (!asset || !/\.(mp4|png|svg|webp)$/u.test(asset.path)) {
      throw new RorschachRequestError(
        400,
        'ASSET_NOT_CURATABLE',
        'Select generated images to keep.'
      );
    }
    return asset;
  });
  const curatedRoot = path.resolve(rootDir, CURATED_ROOT);
  return Promise.all(
    assets.map(async (asset) => {
      const source = resolveRorschachAsset(rootDir, id, asset.path);
      const target = path.resolve(curatedRoot, id, asset.path);
      const curatedPath = path.relative(curatedRoot, target);
      if (
        !curatedPath ||
        curatedPath.startsWith('..') ||
        path.isAbsolute(curatedPath)
      ) {
        throw new RorschachRequestError(
          400,
          'INVALID_CURATED_PATH',
          'Invalid curated image path.'
        );
      }

      await fs.mkdir(path.dirname(target), { recursive: true });
      const sidecarPath = asset.path.replace(/\.[^.]+$/u, '.json');
      const propsPath = path.join(path.dirname(asset.path), 'props.json');
      const metadataAsset =
        job.assets.find((item) => item.path === sidecarPath) ??
        job.assets.find(
          (item) => item.path === propsPath.split(path.sep).join('/')
        );
      const copies = [fs.copyFile(source, target)];
      if (metadataAsset) {
        copies.push(
          fs.copyFile(
            resolveRorschachAsset(rootDir, id, metadataAsset.path),
            path.join(path.dirname(target), metadataAsset.name)
          )
        );
      }
      await Promise.all(copies);
      const urlPath = curatedPath
        .split(path.sep)
        .map(encodeURIComponent)
        .join('/');
      return {
        name: asset.name,
        path: path.relative(rootDir, target).split(path.sep).join('/'),
        size: asset.size,
        url: `/images/rorschach/${urlPath}`,
      };
    })
  );
}
