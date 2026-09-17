import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const MAX_LOG_LINES = 160;
const MANIFEST_FILE = 'manifest.json';
const MANIFEST_VERSION = 1;
const MEDIA = /\.(mp4|png|svg|webp)$/u;
const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'failed']);
const ACTIVE_STATUSES = new Set(['cancelling', 'queued', 'running']);

export class RenderJobRequestError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'RenderJobRequestError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const requestError = (statusCode, code, message) =>
  new RenderJobRequestError(statusCode, code, message);

function toUrlPath(relativePath) {
  return relativePath.split(/[\\/]/u).map(encodeURIComponent).join('/');
}

function assertInside(root, target, code, message) {
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw requestError(400, code, message);
  }
  return relative;
}

function assertCollectionDirectory(rootDir, outputRoot, collectionName) {
  const approvedRoot = path.resolve(rootDir, outputRoot);
  const outputDir = path.resolve(approvedRoot, collectionName);
  if (
    path.dirname(outputDir) !== approvedRoot ||
    outputDir === approvedRoot ||
    !collectionName
  ) {
    throw requestError(
      400,
      'INVALID_COLLECTION_PATH',
      'Invalid output collection path.'
    );
  }
  return outputDir;
}

function publicJob(job) {
  const result = { ...job };
  delete result.child;
  delete result.args;
  return result;
}

function manifestFor(job) {
  const manifest = publicJob(job);
  delete manifest.assets;
  delete manifest.storageBytes;
  return { ...manifest, manifestVersion: MANIFEST_VERSION };
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
      // number vary.
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

async function readManifest(outputDir) {
  try {
    return JSON.parse(await fs.readFile(path.join(outputDir, MANIFEST_FILE)));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

// A flag-emitting helper most tools want: booleans as --x/--no-x, objects as
// JSON, everything else stringified. `skip` decides which keys stay off argv.
export function optionsToFlags(options, skip = () => false) {
  const args = [];
  Object.entries(options).forEach(([key, value]) => {
    if (value == null || skip(key, value)) return;
    if (typeof value === 'boolean') {
      args.push(value ? `--${key}` : `--no-${key}`);
      return;
    }
    // `String()` on an object is "[object Object]" — a flag the CLI accepts
    // and then silently ignores.
    args.push(
      `--${key}`,
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    );
  });
  return args;
}

// The job runner behind a generative workbench: spawns the tool's CLI per
// request, tracks progress off its stdout, persists a manifest beside the
// output, and curates kept media into the public tree.
//
//   tool             route and URL segment ('rorschach', 'flora')
//   outputRoot       where job collections are written (gitignored)
//   curatedRoot      where kept media is copied (served from public/)
//   curatedUrl       the URL prefix curatedRoot is served under
//   extraRoots       older output trees to list read-only: [{ root, prefix }]
//   kinds            the job kinds the tool accepts
//   prepare(rootDir, { kind, payload, outputDirectory, service }) →
//     { args, options, files? } — the CLI argv and the options to record;
//     `files` are written into the collection before the CLI starts
//   maxConcurrent    how many CLIs may run at once; the rest queue
export default function createRenderJobService({
  curatedRoot,
  curatedUrl,
  extraRoots = [],
  kinds,
  maxConcurrent = Infinity,
  outputRoot,
  prepare,
  tool,
}) {
  const jobs = new Map();
  const queue = [];

  const assetUrl = (id, relativePath) =>
    `/dev-api/${tool}/jobs/${id}/assets/${toUrlPath(relativePath)}`;

  async function persistJob(rootDir, job) {
    if (job.source !== 'workbench') return;
    const outputDir = assertCollectionDirectory(rootDir, outputRoot, job.id);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, MANIFEST_FILE),
      `${JSON.stringify(manifestFor(job), null, 2)}\n`
    );
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
              url: assetUrl(job.id, relativePath),
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

  async function listCurated(rootDir) {
    const root = path.resolve(rootDir, curatedRoot);
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

          const relativePath = path.relative(root, target);
          if (!MEDIA.test(relativePath) && !relativePath.endsWith('.json')) {
            return;
          }
          const segments = relativePath.split(path.sep);
          const collectionName =
            segments.length > 1 ? segments.shift() : 'saved';
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
            outputDirectory: path.join(curatedRoot, collectionName),
            phase: 'saved',
            progress: 100,
            source: 'curated',
            status: 'completed',
            storageBytes: 0,
          };
          collection.assets.push({
            name: entry.name,
            path: segments.join('/'),
            size: stats.size,
            url: `${curatedUrl}/${toUrlPath(relativePath)}`,
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
      await walk(root);
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

  async function deleteCuratedAssets(
    rootDir,
    confirmedOutputDirectory,
    relativePaths
  ) {
    if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
      throw requestError(400, 'INVALID_ASSETS', 'Select at least one item.');
    }
    if (relativePaths.length > 500) {
      throw requestError(
        400,
        'TOO_MANY_ASSETS',
        'Delete at most 500 saved items at once.'
      );
    }

    const root = path.resolve(rootDir, curatedRoot);
    const outputDir = path.resolve(rootDir, confirmedOutputDirectory);
    if (path.dirname(outputDir) !== root || outputDir === root) {
      throw requestError(
        400,
        'INVALID_CURATED_COLLECTION',
        'Invalid saved collection path.'
      );
    }

    const targets = [...new Set(relativePaths)].map((relativePath) => {
      if (typeof relativePath !== 'string' || !MEDIA.test(relativePath)) {
        throw requestError(
          400,
          'ASSET_NOT_CURATABLE',
          'Select a saved item to delete.'
        );
      }
      const target = path.resolve(outputDir, relativePath);
      assertInside(
        outputDir,
        target,
        'INVALID_ASSET_PATH',
        'Invalid saved item path.'
      );
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
    return listCurated(rootDir);
  }

  async function discoverCollections(rootDir, root, source, prefix = '') {
    const approvedRoot = path.resolve(rootDir, root);
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
            root,
            entry.name
          );
          const manifest =
            source === 'workbench' ? await readManifest(outputDir) : null;
          const id = `${prefix}${entry.name}`;
          const existing = jobs.get(id);
          const stats = await fs.stat(outputDir);
          const interrupted =
            !existing && ACTIVE_STATUSES.has(manifest?.status);
          const job = existing ?? {
            completedAt: stats.mtime.toISOString(),
            createdAt: stats.birthtime.toISOString(),
            error: null,
            id,
            kind: source === 'workbench' ? (manifest?.kind ?? 'still') : source,
            logs: [],
            options: manifest?.options ?? {},
            outputDirectory: path.relative(rootDir, outputDir),
            phase: manifest?.phase ?? 'complete',
            progress: manifest?.progress ?? 100,
            status: manifest?.status ?? 'completed',
          };
          if (!existing && manifest) Object.assign(job, manifest);
          Object.assign(job, { child: existing?.child ?? null, id, source });
          job.collectionRoot = root;
          if (interrupted) {
            job.completedAt = new Date().toISOString();
            job.error =
              'Render interrupted when the development server stopped.';
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

  function runningCount() {
    return [...jobs.values()].filter((job) => job.child).length;
  }

  function start(rootDir, job) {
    const child = spawn(process.execPath, job.args, { cwd: rootDir });
    Object.assign(job, { child, phase: 'starting', status: 'running' });
    persistJob(rootDir, job).catch((error) => addLog(job, 'server', error));

    child.stdout.on('data', (chunk) => addLog(job, 'stdout', chunk));
    child.stderr.on('data', (chunk) => addLog(job, 'stderr', chunk));
    child.on('error', (error) => {
      Object.assign(job, { error: error.message });
    });
    child.on('close', async (code, signal) => {
      Object.assign(job, {
        child: null,
        completedAt: new Date().toISOString(),
        ...(await discoverAssets(rootDir, job)),
      });
      if (job.status === 'cancelling') {
        Object.assign(job, { phase: 'cancelled', status: 'cancelled' });
      } else if (code === 0) {
        Object.assign(job, {
          phase: 'complete',
          progress: 100,
          status: 'completed',
        });
      } else {
        Object.assign(job, {
          error:
            job.error ??
            `Generator exited with code ${code ?? 'null'}${
              signal ? ` (${signal})` : ''
            }.`,
          phase: 'failed',
          status: 'failed',
        });
      }
      await persistJob(rootDir, job);
      // eslint-disable-next-line no-use-before-define
      drain(rootDir);
    });
  }

  function drain(rootDir) {
    while (queue.length > 0 && runningCount() < maxConcurrent) {
      const job = queue.shift();
      if (job.status === 'queued') start(rootDir, job);
    }
  }

  async function createJob(rootDir, payload = {}) {
    const kind = payload.kind ?? kinds[0];
    if (!kinds.includes(kind)) {
      throw requestError(
        400,
        'INVALID_OPTION',
        `kind must be one of ${kinds.join(', ')}.`
      );
    }
    const id = randomUUID();
    const outputDirectory = path.join(outputRoot, id);
    const prepared = await prepare(rootDir, {
      kind,
      outputDirectory,
      payload,
      // eslint-disable-next-line no-use-before-define
      service: api,
    });

    const job = {
      args: prepared.args,
      assets: [],
      child: null,
      completedAt: null,
      collectionRoot: outputRoot,
      createdAt: new Date().toISOString(),
      error: null,
      id,
      kind,
      logs: [],
      options: prepared.options,
      outputDirectory,
      phase: 'queued',
      progress: 0,
      source: 'workbench',
      status: 'queued',
    };
    jobs.set(id, job);
    await persistJob(rootDir, job);
    const outputDir = path.resolve(rootDir, outputDirectory);
    await Promise.all(
      Object.entries(prepared.files ?? {}).map(([name, content]) =>
        fs.writeFile(
          path.join(
            outputDir,
            assertInside(
              outputDir,
              path.resolve(outputDir, name),
              'INVALID_ASSET_PATH',
              'Invalid job input path.'
            )
          ),
          content
        )
      )
    );

    queue.push(job);
    drain(rootDir);
    return publicJob(job);
  }

  async function listJobs(rootDir) {
    const collections = (
      await Promise.all([
        discoverCollections(rootDir, outputRoot, 'workbench'),
        ...extraRoots.map(({ prefix, root, source }) =>
          discoverCollections(rootDir, root, source, prefix)
        ),
      ])
    ).flat();
    const discoveredIds = new Set(collections.map((job) => job.id));
    jobs.forEach((job, id) => {
      if (!job.child && job.status !== 'queued' && !discoveredIds.has(id)) {
        jobs.delete(id);
      }
    });
    return collections
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(publicJob);
  }

  function getJob(id) {
    const job = jobs.get(id);
    if (!job) throw requestError(404, 'JOB_NOT_FOUND', 'Render job not found.');
    return job;
  }

  async function cancelJob(rootDir, id) {
    const job = getJob(id);
    if (job.status === 'queued') {
      Object.assign(job, {
        completedAt: new Date().toISOString(),
        phase: 'cancelled',
        status: 'cancelled',
      });
      await persistJob(rootDir, job);
      return publicJob(job);
    }
    if (job.status !== 'running' || !job.child) return publicJob(job);
    Object.assign(job, { phase: 'cancelling', status: 'cancelling' });
    job.child.kill('SIGTERM');
    await persistJob(rootDir, job);
    return publicJob(job);
  }

  function deletableCollection(rootDir, id, confirmedOutputDirectory) {
    const job = jobs.get(id);
    if (!job) {
      throw requestError(404, 'JOB_NOT_FOUND', 'Output collection not found.');
    }
    if (!TERMINAL_STATUSES.has(job.status) || job.child) {
      throw requestError(
        409,
        'COLLECTION_ACTIVE',
        'Cancel the active render before deleting its output.'
      );
    }
    if (confirmedOutputDirectory !== job.outputDirectory) {
      throw requestError(
        400,
        'DELETE_CONFIRMATION_MISMATCH',
        'Output directory confirmation does not match the collection.'
      );
    }
    const outputDir = assertCollectionDirectory(
      rootDir,
      job.collectionRoot ?? outputRoot,
      path.basename(job.outputDirectory)
    );
    return { job, outputDir };
  }

  async function deleteCollection(rootDir, id, confirmedOutputDirectory) {
    const { outputDir } = deletableCollection(
      rootDir,
      id,
      confirmedOutputDirectory
    );
    await fs.rm(outputDir, { recursive: true });
    jobs.delete(id);
    return { id };
  }

  async function deleteCollections(rootDir, collections) {
    if (!Array.isArray(collections) || collections.length === 0) {
      throw requestError(
        400,
        'INVALID_COLLECTIONS',
        'Select at least one output collection.'
      );
    }
    if (collections.length > 100) {
      throw requestError(
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
      ...deletableCollection(
        rootDir,
        collection.id,
        collection.outputDirectory
      ),
    }));
    await Promise.all(
      targets.map(({ outputDir }) => fs.rm(outputDir, { recursive: true }))
    );
    targets.forEach(({ id }) => jobs.delete(id));
    return { ids: targets.map(({ id }) => id) };
  }

  async function deleteAssets(
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
      throw requestError(
        400,
        'INVALID_ASSETS',
        'Select at least one output item.'
      );
    }
    if (relativePaths.length > 500) {
      throw requestError(
        400,
        'TOO_MANY_ASSETS',
        'Delete at most 500 files at once.'
      );
    }
    const indexedPaths = new Set(job.assets.map((asset) => asset.path));
    const paths = [...new Set(relativePaths)];
    const targets = paths.map((relativePath) => {
      if (typeof relativePath !== 'string' || !indexedPaths.has(relativePath)) {
        throw requestError(
          400,
          'ASSET_NOT_INDEXED',
          'Output item is not part of this collection.'
        );
      }
      const target = path.resolve(outputDir, relativePath);
      assertInside(outputDir, target, 'INVALID_ASSET_PATH', 'Invalid path.');
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

  function resolveAsset(rootDir, id, relativePath) {
    const job = getJob(id);
    const outputDir = path.resolve(rootDir, job.outputDirectory);
    const target = path.resolve(outputDir, relativePath);
    assertInside(outputDir, target, 'INVALID_ASSET_PATH', 'Invalid path.');
    return target;
  }

  async function keepAssets(rootDir, id, relativePaths) {
    const job = getJob(id);
    if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
      throw requestError(
        400,
        'ASSET_NOT_CURATABLE',
        'Select at least one generated item to keep.'
      );
    }
    const paths = [...new Set(relativePaths)];
    const assets = paths.map((relativePath) => {
      const asset = job.assets.find((item) => item.path === relativePath);
      if (!asset || !MEDIA.test(asset.path)) {
        throw requestError(
          400,
          'ASSET_NOT_CURATABLE',
          'Select generated media to keep.'
        );
      }
      return asset;
    });
    const root = path.resolve(rootDir, curatedRoot);
    return Promise.all(
      assets.map(async (asset) => {
        const source = resolveAsset(rootDir, id, asset.path);
        const target = path.resolve(root, id, asset.path);
        const curatedPath = assertInside(
          root,
          target,
          'INVALID_CURATED_PATH',
          'Invalid curated path.'
        );

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
              resolveAsset(rootDir, id, metadataAsset.path),
              path.join(path.dirname(target), metadataAsset.name)
            )
          );
        }
        await Promise.all(copies);
        return {
          name: asset.name,
          path: path.relative(rootDir, target).split(path.sep).join('/'),
          size: asset.size,
          url: `${curatedUrl}/${toUrlPath(curatedPath)}`,
        };
      })
    );
  }

  // Reads a JSON sidecar out of either tree by the URL the gallery holds —
  // which is how a workbench hands generations back to its own CLI.
  async function readSidecar(rootDir, url) {
    if (typeof url !== 'string' || !url.endsWith('.json')) {
      throw requestError(400, 'INVALID_SOURCE', 'Sources must be JSON files.');
    }
    const decoded = url.split('/').map(decodeURIComponent).join('/');
    let file;
    const jobMatch = decoded.match(
      new RegExp(`^/dev-api/${tool}/jobs/([^/]+)/assets/(.+)$`, 'u')
    );
    if (jobMatch) {
      file = resolveAsset(rootDir, jobMatch[1], jobMatch[2]);
    } else if (decoded.startsWith(`${curatedUrl}/`)) {
      const root = path.resolve(rootDir, curatedRoot);
      file = path.resolve(root, decoded.slice(curatedUrl.length + 1));
      assertInside(root, file, 'INVALID_SOURCE', 'Invalid source path.');
    } else {
      throw requestError(400, 'INVALID_SOURCE', 'Unknown source location.');
    }
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      throw requestError(400, 'INVALID_SOURCE', `Could not read ${url}.`);
    }
  }

  const api = {
    cancelJob,
    createJob,
    deleteAssets,
    deleteCollection,
    deleteCollections,
    deleteCuratedAssets,
    getJob: (id) => publicJob(getJob(id)),
    keepAssets,
    listCurated,
    listJobs,
    readSidecar,
    resolveAsset,
  };
  return api;
}
