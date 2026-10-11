import fs from 'node:fs/promises';
import path from 'node:path';

import { CatalogRequestError } from './service';

const BYLINE_FILE = 'byline.md';
const MAX_BYLINE_CHARS = 2000;
const SOURCE_PATH_PATTERN =
  /^src\/(?:components\/scenes\/(?:WebGL|WebGPU|Shared)|dev\/tools)\/[A-Za-z0-9_-]+$/u;

async function getBylinePath(rootDir, sourcePath) {
  if (!SOURCE_PATH_PATTERN.test(String(sourcePath ?? ''))) {
    throw new CatalogRequestError(
      400,
      'INVALID_SOURCE_PATH',
      'Bylines can only belong to a scene or dev tool folder.'
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

  return path.join(folder, BYLINE_FILE);
}

export async function listBylines(rootDir) {
  const found = {};
  const roots = [
    ['src', 'components', 'scenes', 'WebGL'],
    ['src', 'components', 'scenes', 'WebGPU'],
    ['src', 'components', 'scenes', 'Shared'],
    ['src', 'dev', 'tools'],
  ];

  await Promise.all(
    roots.map(async (segments) => {
      let entries;
      try {
        entries = await fs.readdir(path.join(rootDir, ...segments), {
          withFileTypes: true,
        });
      } catch (error) {
        if (error.code === 'ENOENT') return;
        throw error;
      }

      await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map(async (entry) => {
            try {
              const text = await fs.readFile(
                path.join(rootDir, ...segments, entry.name, BYLINE_FILE),
                'utf8'
              );
              if (text.trim())
                found[[...segments, entry.name].join('/')] = true;
            } catch (error) {
              if (error.code !== 'ENOENT') throw error;
            }
          })
      );
    })
  );

  return found;
}

export async function readByline(rootDir, sourcePath) {
  const bylinePath = await getBylinePath(rootDir, sourcePath);

  try {
    return {
      sourcePath,
      byline: (await fs.readFile(bylinePath, 'utf8')).trim(),
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { sourcePath, byline: '' };
  }
}

export async function writeByline({ byline, rootDir, sourcePath }) {
  if (typeof byline !== 'string' || byline.length > MAX_BYLINE_CHARS) {
    throw new CatalogRequestError(
      400,
      'INVALID_BYLINE',
      `Bylines must be text of at most ${MAX_BYLINE_CHARS} characters.`
    );
  }

  const bylinePath = await getBylinePath(rootDir, sourcePath);
  const text = byline.trim();

  if (!text) {
    await fs.rm(bylinePath, { force: true });
  } else {
    await fs.writeFile(bylinePath, `${text}\n`);
  }

  return { ok: true, sourcePath, byline: text };
}
