import fs from 'node:fs';
import path from 'node:path';

import { RenderJobRequestError } from './jobService';

const MAX_BODY_BYTES = 256 * 1024;

const CONTENT_TYPES = {
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
};

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

export function readJsonBody(req) {
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
          new RenderJobRequestError(
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
          new RenderJobRequestError(
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

function parseByteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header ?? '');
  if (!match || (!match[1] && !match[2])) return null;

  const requestedStart = match[1] ? Number(match[1]) : null;
  const requestedEnd = match[2] ? Number(match[2]) : null;
  const start = requestedStart ?? Math.max(0, size - requestedEnd);
  const end = Math.min(requestedEnd ?? size - 1, size - 1);
  return start <= end && start < size ? { end, start } : null;
}

// Range support is what lets a <video> seek a clip that is still on disk.
async function streamAsset(req, res, next, assetPath) {
  const { size } = await fs.promises.stat(assetPath);
  const range = req.headers.range
    ? parseByteRange(req.headers.range, size)
    : null;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader(
    'Content-Type',
    CONTENT_TYPES[path.extname(assetPath).toLowerCase()] ??
      'application/octet-stream'
  );

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

export async function handleJson(res, handler) {
  try {
    sendJson(res, 200, { ok: true, ...(await handler()) });
  } catch (error) {
    const known = error instanceof RenderJobRequestError;
    sendJson(res, known ? error.statusCode : 500, {
      ok: false,
      code: known ? error.code : 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unexpected error.',
    });
  }
}

// The /dev-api/<tool> surface every generative workbench shares: jobs, their
// assets, and the kept ("saved") tree. `routes` adds tool-specific endpoints,
// each `{ method, path, handler(rootDir, body) }` answered as JSON.
export default function createRenderJobPlugin({ routes = [], service, tool }) {
  const base = `/dev-api/${tool}`;
  const jobsApi = `${base}/jobs`;
  const savedApi = `${base}/saved`;
  const jobPattern = new RegExp(`^${jobsApi}/([^/]+)(/.*)?$`, 'u');

  return {
    name: `${tool}-dev-plugin`,
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (!pathname.startsWith(base)) {
          next();
          return;
        }
        const rootDir = server.config.root;
        const { method } = req;
        const json = (handler) => handleJson(res, handler);
        const body = () => readJsonBody(req);

        const extra = routes.find(
          (route) =>
            route.method === method && `${base}${route.path}` === pathname
        );
        if (extra) {
          await json(async () =>
            extra.handler(rootDir, method === 'GET' ? {} : await body())
          );
          return;
        }

        if (pathname === savedApi && method === 'GET') {
          await json(async () => ({
            collections: await service.listCurated(rootDir),
          }));
          return;
        }
        if (pathname === `${savedApi}/assets` && method === 'DELETE') {
          await json(async () => {
            const { outputDirectory, paths } = await body();
            return {
              collections: await service.deleteCuratedAssets(
                rootDir,
                outputDirectory,
                paths
              ),
            };
          });
          return;
        }
        if (pathname === jobsApi) {
          if (method === 'GET') {
            await json(async () => ({
              jobs: await service.listJobs(rootDir),
            }));
            return;
          }
          if (method === 'POST') {
            await json(async () => ({
              job: await service.createJob(rootDir, await body()),
            }));
            return;
          }
          if (method === 'DELETE') {
            await json(async () => ({
              deleted: await service.deleteCollections(
                rootDir,
                (await body()).collections
              ),
            }));
            return;
          }
        }

        const match = pathname.match(jobPattern);
        if (!match) {
          next();
          return;
        }
        const [, id, rest = ''] = match;

        if (rest === '' && method === 'GET') {
          await json(() => ({ job: service.getJob(id) }));
          return;
        }
        if (rest === '' && method === 'DELETE') {
          await json(async () => ({
            deleted: await service.deleteCollection(
              rootDir,
              id,
              (await body()).outputDirectory
            ),
          }));
          return;
        }
        if (rest === '/cancel' && method === 'POST') {
          await json(async () => ({
            job: await service.cancelJob(rootDir, id),
          }));
          return;
        }
        if (rest === '/assets' && method === 'DELETE') {
          await json(async () => {
            const { outputDirectory, paths } = await body();
            return {
              job: await service.deleteAssets(
                rootDir,
                id,
                outputDirectory,
                paths
              ),
            };
          });
          return;
        }
        if (rest === '/assets' && method === 'POST') {
          await json(async () => {
            const payload = await body();
            return {
              assets: await service.keepAssets(
                rootDir,
                id,
                payload.paths ?? [payload.path]
              ),
            };
          });
          return;
        }
        if (rest.startsWith('/assets/') && ['GET', 'HEAD'].includes(method)) {
          try {
            const assetPath = service.resolveAsset(
              rootDir,
              id,
              rest
                .slice('/assets/'.length)
                .split('/')
                .map(decodeURIComponent)
                .join('/')
            );
            await streamAsset(req, res, next, assetPath);
          } catch (error) {
            await json(() => Promise.reject(error));
          }
          return;
        }

        next();
      });
    },
  };
}
