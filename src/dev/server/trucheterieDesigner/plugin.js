import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const API = '/dev-api/trucheterie-designer/designs';
const DESIGNS_DIR = path.join('src', 'modules', 'trucheterieBlob', 'designs');
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const MAX_BODY_BYTES = 256 * 1024;

class DesignRequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new DesignRequestError(413, 'Design is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new DesignRequestError(400, 'Request body must be JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function fileFor(root, name) {
  if (!NAME.test(name)) {
    throw new DesignRequestError(
      400,
      'Design names are lowercase letters, digits and dashes.'
    );
  }
  return path.join(root, DESIGNS_DIR, `${name}.json`);
}

// Shape only: overlap and neighbour-rule validation is the kernel's, run by the CLIs and trucheterie:check.
function checkShape({ cells, rotation }) {
  if (!Array.isArray(cells)) {
    throw new DesignRequestError(400, 'A design needs cells.');
  }
  if (rotation !== undefined && !Number.isFinite(rotation)) {
    throw new DesignRequestError(400, 'Rotation is a number of degrees.');
  }
  if (
    !cells.every(
      (cell) =>
        Array.isArray(cell) && cell.length === 4 && cell.every(Number.isInteger)
    )
  ) {
    throw new DesignRequestError(400, 'Cells are [column, row, size, mask].');
  }
}

const formatDesign = ({ cells, irregular, name, rotation = 0 }) =>
  `{\n  "name": ${JSON.stringify(name)},\n  "rotation": ${rotation},${irregular ? '\n  "irregular": true,' : ''}\n  "cells": [\n${cells
    .map((cell) => `    ${JSON.stringify(cell)}`)
    .join(',\n')}\n  ]\n}\n`;

function extentOf(cells) {
  if (cells.length === 0) return null;
  const spans = [0, 1].map((axis) => {
    const lo = Math.min(...cells.map((cell) => cell[axis]));
    const hi = Math.max(...cells.map((cell) => cell[axis] + cell[2]));
    return hi - lo;
  });
  return `${spans[0]}×${spans[1]}`;
}

async function listDesigns(root) {
  const dir = path.join(root, DESIGNS_DIR);
  const names = (await readdir(dir).catch(() => []))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -5))
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const file = path.join(dir, `${name}.json`);
      const [json, info] = await Promise.all([
        readFile(file, 'utf8').then(JSON.parse),
        stat(file),
      ]);
      return {
        cells: json.cells?.length ?? 0,
        extent: extentOf(json.cells ?? []),
        name,
        updated: info.mtime.toISOString(),
      };
    })
  );
}

async function route(req, root, name) {
  if (!name && req.method === 'GET')
    return { designs: await listDesigns(root) };
  if (!name) throw new DesignRequestError(405, 'Method not allowed.');
  const file = fileFor(root, name);
  if (req.method === 'GET') {
    try {
      return { design: JSON.parse(await readFile(file, 'utf8')) };
    } catch {
      throw new DesignRequestError(404, `No design named "${name}".`);
    }
  }
  if (req.method === 'PUT') {
    const body = await readJsonBody(req);
    checkShape(body);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, formatDesign({ ...body, name }));
    return { name };
  }
  if (req.method === 'DELETE') {
    await rm(file, { force: true });
    return { name };
  }
  throw new DesignRequestError(405, 'Method not allowed.');
}

export default function trucheterieDesignerDevPlugin() {
  return {
    apply: 'serve',
    name: 'trucheterie-designer-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (pathname !== API && !pathname.startsWith(`${API}/`)) {
          next();
          return;
        }
        const name = decodeURIComponent(pathname.slice(API.length + 1));
        try {
          sendJson(res, 200, {
            ok: true,
            ...(await route(req, server.config.root, name)),
          });
        } catch (error) {
          const known = error instanceof DesignRequestError;
          sendJson(res, known ? error.statusCode : 500, {
            message:
              error instanceof Error ? error.message : 'Unexpected error.',
            ok: false,
          });
        }
      });
    },
  };
}
