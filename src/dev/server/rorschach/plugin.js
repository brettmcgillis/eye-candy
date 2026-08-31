import fs from 'node:fs';
import path from 'node:path';

import {
  RorschachRequestError,
  cancelRorschachJob,
  createRorschachJob,
  deleteCuratedRorschachAssets,
  deleteRorschachAssets,
  deleteRorschachCollection,
  deleteRorschachCollections,
  getRorschachJob,
  keepRorschachAssets,
  listCuratedRorschachCollections,
  listRorschachJobs,
  resolveRorschachAsset,
} from './jobService';
import writeScenePreset from './presetWriter';

const API_ROOT = '/dev-api/rorschach/jobs';
const CURATED_API = '/dev-api/rorschach/saved';
const PRESETS_API = '/dev-api/rorschach/presets';
const MAX_BODY_BYTES = 64 * 1024;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let failed = false;

    req.on('data', (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        failed = true;
        reject(
          new RorschachRequestError(
            413,
            'PAYLOAD_TOO_LARGE',
            'Request is too large.'
          )
        );
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (failed) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(
          new RorschachRequestError(
            400,
            'INVALID_JSON',
            'Request body must be JSON.'
          )
        );
      }
    });
    req.on('error', reject);
  });
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.svg') return 'image/svg+xml; charset=utf-8';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.mp4') return 'video/mp4';
  if (extension === '.json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function parseByteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header ?? '');
  if (!match || (!match[1] && !match[2])) return null;

  const requestedStart = match[1] ? Number(match[1]) : null;
  const requestedEnd = match[2] ? Number(match[2]) : null;
  const start = requestedStart ?? Math.max(0, size - requestedEnd);
  const end = Math.min(requestedEnd ?? size - 1, size - 1);
  return start <= end && start < size ? { end, start } : null;
}

async function streamAsset(req, res, next, assetPath) {
  const { size } = await fs.promises.stat(assetPath);
  const range = req.headers.range
    ? parseByteRange(req.headers.range, size)
    : null;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', contentType(assetPath));

  if (req.headers.range && !range) {
    res.statusCode = 416;
    res.setHeader('Content-Range', `bytes */${size}`);
    res.end();
    return;
  }

  const start = range?.start ?? 0;
  const end = range?.end ?? size - 1;
  res.statusCode = range ? 206 : 200;
  res.setHeader('Content-Length', end - start + 1);
  if (range) res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(assetPath, { end, start }).on('error', next).pipe(res);
}

async function handleJson(res, handler) {
  try {
    sendJson(res, 200, { ok: true, ...(await handler()) });
  } catch (error) {
    const known = error instanceof RorschachRequestError;
    sendJson(res, known ? error.statusCode : 500, {
      ok: false,
      code: known ? error.code : 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unexpected error.',
    });
  }
}

export default function rorschachDevPlugin() {
  return {
    name: 'rorschach-dev-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        const rootDir = server.config.root;

        if (pathname === CURATED_API && req.method === 'GET') {
          await handleJson(res, async () => ({
            collections: await listCuratedRorschachCollections(rootDir),
          }));
          return;
        }
        if (pathname === `${CURATED_API}/assets` && req.method === 'DELETE') {
          await handleJson(res, async () => {
            const body = await readJsonBody(req);
            return {
              collections: await deleteCuratedRorschachAssets(
                rootDir,
                body.outputDirectory,
                body.paths
              ),
            };
          });
          return;
        }
        // The one route that writes toward the scene: a generated still
        // promoted into a preset the 3D scene can open. Everything else here
        // only ever reads the scene's side of the repo, or nothing of it.
        if (pathname === PRESETS_API && req.method === 'POST') {
          await handleJson(res, async () => {
            const body = await readJsonBody(req);
            return { preset: await writeScenePreset(rootDir, body.preset) };
          });
          return;
        }
        if (pathname === API_ROOT && req.method === 'GET') {
          await handleJson(res, async () => ({
            jobs: await listRorschachJobs(rootDir),
          }));
          return;
        }
        if (pathname === API_ROOT && req.method === 'POST') {
          await handleJson(res, async () => ({
            job: await createRorschachJob(rootDir, await readJsonBody(req)),
          }));
          return;
        }
        if (pathname === API_ROOT && req.method === 'DELETE') {
          await handleJson(res, async () => {
            const body = await readJsonBody(req);
            return {
              deleted: await deleteRorschachCollections(
                rootDir,
                body.collections
              ),
            };
          });
          return;
        }

        const collectionAssetsMatch = pathname.match(
          /^\/dev-api\/rorschach\/jobs\/([^/]+)\/assets$/u
        );
        if (collectionAssetsMatch && req.method === 'DELETE') {
          await handleJson(res, async () => {
            const body = await readJsonBody(req);
            return {
              job: await deleteRorschachAssets(
                rootDir,
                collectionAssetsMatch[1],
                body.outputDirectory,
                body.paths
              ),
            };
          });
          return;
        }
        if (collectionAssetsMatch && req.method === 'POST') {
          await handleJson(res, async () => {
            const body = await readJsonBody(req);
            return {
              assets: await keepRorschachAssets(
                rootDir,
                collectionAssetsMatch[1],
                body.paths ?? [body.path]
              ),
            };
          });
          return;
        }

        const assetMatch = pathname.match(
          /^\/dev-api\/rorschach\/jobs\/([^/]+)\/assets\/(.+)$/u
        );
        if (assetMatch && ['GET', 'HEAD'].includes(req.method)) {
          try {
            const assetPath = resolveRorschachAsset(
              rootDir,
              assetMatch[1],
              assetMatch[2].split('/').map(decodeURIComponent).join('/')
            );
            await streamAsset(req, res, next, assetPath);
          } catch (error) {
            await handleJson(res, () => Promise.reject(error));
          }
          return;
        }

        const jobMatch = pathname.match(
          /^\/dev-api\/rorschach\/jobs\/([^/]+)$/u
        );
        if (jobMatch && req.method === 'GET') {
          await handleJson(res, () => ({ job: getRorschachJob(jobMatch[1]) }));
          return;
        }
        if (jobMatch && req.method === 'DELETE') {
          await handleJson(res, async () => {
            const body = await readJsonBody(req);
            return {
              deleted: await deleteRorschachCollection(
                rootDir,
                jobMatch[1],
                body.outputDirectory
              ),
            };
          });
          return;
        }

        const cancelMatch = pathname.match(
          /^\/dev-api\/rorschach\/jobs\/([^/]+)\/cancel$/u
        );
        if (cancelMatch && req.method === 'POST') {
          await handleJson(res, async () => ({
            job: await cancelRorschachJob(rootDir, cancelMatch[1]),
          }));
          return;
        }

        next();
      });
    },
  };
}
