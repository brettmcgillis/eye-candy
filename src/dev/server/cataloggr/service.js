import fs from 'node:fs/promises';
import path from 'node:path';

import discoverLocalPresets from './presetInventory';

const CATALOG_PATH = path.join(
  'src',
  'dev',
  'tools',
  'cataloggr',
  'catalog.json'
);
const MAX_REQUEST_BYTES = 1024 * 1024;
const MAX_IDEA_COUNT = 1000;
const MAX_IDEA_TEXT_LENGTH = 10000;
const MAX_STATUS_COUNT = 10000;

export class CatalogRequestError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'CatalogRequestError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getCatalogPath(rootDir) {
  return path.join(rootDir, CATALOG_PATH);
}

function normalizeStatuses(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CatalogRequestError(
      400,
      'INVALID_STATUSES',
      'Catalog statuses must be an object.'
    );
  }

  const entries = Object.entries(value);

  if (entries.length > MAX_STATUS_COUNT) {
    throw new CatalogRequestError(
      400,
      'TOO_MANY_STATUSES',
      `Catalog statuses cannot exceed ${MAX_STATUS_COUNT} entries.`
    );
  }

  return Object.fromEntries(
    entries
      .map(([key, posted]) => [String(key).trim(), posted])
      .filter(([key]) => key)
      .map(([key, posted]) => {
        if (typeof posted !== 'boolean') {
          throw new CatalogRequestError(
            400,
            'INVALID_STATUS',
            `Catalog status "${key}" must be a boolean.`
          );
        }

        return [key, posted];
      })
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function normalizeIdeas(value) {
  if (!Array.isArray(value)) {
    throw new CatalogRequestError(
      400,
      'INVALID_IDEAS',
      'Catalog ideas must be an array.'
    );
  }

  if (value.length > MAX_IDEA_COUNT) {
    throw new CatalogRequestError(
      400,
      'TOO_MANY_IDEAS',
      `Catalog ideas cannot exceed ${MAX_IDEA_COUNT} entries.`
    );
  }

  const ids = new Set();

  return value.map((idea) => {
    const id = String(idea?.id ?? '').trim();
    const text = String(idea?.text ?? '').trim();

    if (!id || !text) {
      throw new CatalogRequestError(
        400,
        'INVALID_IDEA',
        'Every catalog idea requires a non-empty id and text.'
      );
    }

    if (ids.has(id)) {
      throw new CatalogRequestError(
        400,
        'DUPLICATE_IDEA',
        `Catalog idea id "${id}" is duplicated.`
      );
    }

    if (text.length > MAX_IDEA_TEXT_LENGTH) {
      throw new CatalogRequestError(
        400,
        'IDEA_TOO_LONG',
        `Catalog idea "${id}" exceeds ${MAX_IDEA_TEXT_LENGTH} characters.`
      );
    }

    ids.add(id);
    return { id, text };
  });
}

export async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let byteCount = 0;

    req.on('data', (chunk) => {
      byteCount += chunk.length;

      if (byteCount > MAX_REQUEST_BYTES) {
        reject(
          new CatalogRequestError(
            413,
            'REQUEST_TOO_LARGE',
            'Catalog request is too large.'
          )
        );
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(
          new CatalogRequestError(
            400,
            'INVALID_JSON',
            'Catalog request body must be valid JSON.'
          )
        );
      }
    });
    req.on('error', reject);
  });
}

export async function readCatalog(rootDir) {
  const [contents, presetsByFolder] = await Promise.all([
    fs.readFile(getCatalogPath(rootDir), 'utf8'),
    discoverLocalPresets(rootDir),
  ]);
  const catalog = JSON.parse(contents);

  return {
    version: 2,
    ideas: normalizeIdeas(catalog.ideas ?? []),
    statuses: normalizeStatuses(catalog.statuses ?? {}),
    presetsByFolder,
  };
}

export async function writeCatalog({ payload, rootDir }) {
  const catalogPath = getCatalogPath(rootDir);
  const currentCatalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
  const nextCatalog = {
    version: 2,
    ideas: normalizeIdeas(payload?.ideas ?? currentCatalog.ideas ?? []),
    statuses: normalizeStatuses(
      payload?.statuses ?? currentCatalog.statuses ?? {}
    ),
  };
  const temporaryPath = `${catalogPath}.tmp`;

  await fs.writeFile(
    temporaryPath,
    `${JSON.stringify(nextCatalog, null, 2)}\n`,
    'utf8'
  );
  await fs.rename(temporaryPath, catalogPath);

  return { ok: true, ...nextCatalog };
}
