import fs from 'node:fs/promises';
import path from 'node:path';

import { CatalogRequestError } from './service';

const THUMBNAIL_FILE = 'thumbnail.webp';
const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024;
const THUMBNAIL_ROOTS = [
  ['src', 'components', 'scenes', 'WebGL'],
  ['src', 'components', 'scenes', 'WebGPU'],
  ['src', 'components', 'scenes', 'Shared'],
  ['src', 'dev', 'tools'],
];
const SOURCE_PATH_PATTERN =
  /^src\/(?:components\/scenes\/(?:WebGL|WebGPU|Shared)|dev\/tools)\/[A-Za-z0-9_-]+$/u;
const WEBP_SIGNATURE = [
  [0, 'RIFF'],
  [8, 'WEBP'],
];

async function getThumbnailPath(rootDir, sourcePath) {
  if (!SOURCE_PATH_PATTERN.test(String(sourcePath ?? ''))) {
    throw new CatalogRequestError(
      400,
      'INVALID_SOURCE_PATH',
      'Thumbnails can only belong to a scene or dev tool folder.'
    );
  }

  const folder = path.join(rootDir, ...sourcePath.split('/'));

  try {
    if (!(await fs.stat(folder)).isDirectory()) throw new Error();
  } catch {
    throw new CatalogRequestError(
      404,
      'SOURCE_NOT_FOUND',
      `No folder exists at ${sourcePath}.`
    );
  }

  return path.join(folder, THUMBNAIL_FILE);
}

export async function listThumbnails(rootDir) {
  const found = {};

  await Promise.all(
    THUMBNAIL_ROOTS.map(async (segments) => {
      const rootPath = path.join(rootDir, ...segments);
      let entries;

      try {
        entries = await fs.readdir(rootPath, { withFileTypes: true });
      } catch (error) {
        if (error.code === 'ENOENT') return;
        throw error;
      }

      await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map(async (entry) => {
            try {
              const stats = await fs.stat(
                path.join(rootPath, entry.name, THUMBNAIL_FILE)
              );
              found[[...segments, entry.name].join('/')] = Math.round(
                stats.mtimeMs
              );
            } catch (error) {
              if (error.code !== 'ENOENT') throw error;
            }
          })
      );
    })
  );

  return found;
}

export async function readThumbnail(rootDir, sourcePath) {
  const thumbnailPath = await getThumbnailPath(rootDir, sourcePath);

  try {
    return await fs.readFile(thumbnailPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new CatalogRequestError(
      404,
      'THUMBNAIL_NOT_FOUND',
      `${sourcePath} has no thumbnail.`
    );
  }
}

function isWebp(buffer) {
  return WEBP_SIGNATURE.every(
    ([offset, text]) =>
      buffer.subarray(offset, offset + text.length).toString('ascii') === text
  );
}

export function readBinaryBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let byteCount = 0;

    req.on('data', (chunk) => {
      byteCount += chunk.length;

      if (byteCount > MAX_THUMBNAIL_BYTES) {
        reject(
          new CatalogRequestError(
            413,
            'THUMBNAIL_TOO_LARGE',
            'Thumbnails must be smaller than 4 MiB.'
          )
        );
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function writeThumbnail({ body, rootDir, sourcePath }) {
  if (!isWebp(body)) {
    throw new CatalogRequestError(
      415,
      'THUMBNAIL_NOT_WEBP',
      'Thumbnails must be uploaded as WebP.'
    );
  }

  const thumbnailPath = await getThumbnailPath(rootDir, sourcePath);
  const temporaryPath = `${thumbnailPath}.tmp`;

  await fs.writeFile(temporaryPath, body);
  await fs.rename(temporaryPath, thumbnailPath);

  const stats = await fs.stat(thumbnailPath);
  return { ok: true, sourcePath, updatedAt: Math.round(stats.mtimeMs) };
}
