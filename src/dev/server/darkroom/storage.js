import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { RenderJobRequestError } from '../renderJobs/jobService';

export const WORKBENCH_ROOT = path.join('output', 'darkroom-workbench');
const SOURCES = path.join(WORKBENCH_ROOT, 'sources');
const STAGING = path.join(WORKBENCH_ROOT, 'staging');

const MAX_SOURCE_BYTES = 2 * 1024 ** 3;
const MAX_FRAME_BYTES = 96 * 1024 ** 2;

const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const VIDEO_TYPES = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
};
const IMAGE_EXTENSIONS = new Set(Object.values(IMAGE_TYPES));
const NAME = /^[0-9a-f]{16}\.(jpg|png|webp|mp4)$/u;
const SESSION = /^[0-9a-f-]{36}$/u;

const fail = (status, code, message) =>
  new RenderJobRequestError(status, code, message);

function writeBody(req, target, maxBytes) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha1');
    const out = createWriteStream(target);
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        out.destroy();
        reject(fail(413, 'PAYLOAD_TOO_LARGE', 'Upload is too large.'));
        return;
      }
      hash.update(chunk);
    });
    req.on('error', reject);
    out.on('error', reject);
    out.on('finish', () => resolve({ hash: hash.digest('hex'), size }));
    req.pipe(out);
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited ${code}\n${stderr.slice(-1500)}`))
    );
  });
}

// Browsers seek an H.264 mp4 reliably; a MediaRecorder webm has no cues and
// an iPhone .mov is often HEVC, so both are re-encoded once on the way in.
function toMp4(input, output) {
  return run('ffmpeg', [
    '-y',
    '-i',
    input,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0?',
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '16',
    '-g',
    '12',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    output,
  ]);
}

const sourceUrl = (name) => `/dev-api/darkroom/sources/${name}`;

function describe(name, stats) {
  const extension = name.split('.').pop();
  return {
    kind: IMAGE_EXTENSIONS.has(extension) ? 'image' : 'video',
    modifiedAt: stats.mtime.toISOString(),
    name,
    size: stats.size,
    url: sourceUrl(name),
  };
}

export function sourcePath(rootDir, name) {
  if (!NAME.test(name)) throw fail(400, 'INVALID_SOURCE', 'Unknown source.');
  return path.join(rootDir, SOURCES, name);
}

// Content-addressed: the same clip uploaded from the phone and the desktop
// is one file.
export async function saveSource(rootDir, req) {
  const type = String(req.headers['content-type'] ?? '').split(';')[0];
  const extension = IMAGE_TYPES[type] ?? VIDEO_TYPES[type];
  if (!extension) {
    throw fail(
      415,
      'UNSUPPORTED_MEDIA',
      'Upload a JPEG, PNG or WebP image, or an MP4, MOV or WebM video.'
    );
  }
  const directory = path.join(rootDir, SOURCES);
  await fs.mkdir(directory, { recursive: true });
  const incoming = path.join(directory, `incoming-${randomUUID()}`);
  try {
    const { hash } = await writeBody(req, incoming, MAX_SOURCE_BYTES);
    const final = IMAGE_TYPES[type] || extension === 'mp4' ? extension : 'mp4';
    const name = `${hash.slice(0, 16)}.${final}`;
    const target = path.join(directory, name);
    const exists = await fs.stat(target).catch(() => null);
    if (!exists) {
      if (final === extension) await fs.rename(incoming, target);
      else await toMp4(incoming, target);
    }
    return { source: describe(name, await fs.stat(target)) };
  } finally {
    await fs.rm(incoming, { force: true });
  }
}

export async function listSources(rootDir) {
  const directory = path.join(rootDir, SOURCES);
  const names = (await fs.readdir(directory).catch(() => [])).filter((name) =>
    NAME.test(name)
  );
  const sources = await Promise.all(
    names.map(async (name) =>
      describe(name, await fs.stat(path.join(directory, name)))
    )
  );
  return {
    sources: sources.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)),
  };
}

export async function deleteSource(rootDir, name) {
  await fs.rm(sourcePath(rootDir, name), { force: true });
  return listSources(rootDir);
}

export function sessionPath(rootDir, id) {
  if (!SESSION.test(id)) throw fail(400, 'INVALID_SESSION', 'Unknown session.');
  return path.join(rootDir, STAGING, id);
}

export async function createSession(rootDir) {
  const id = randomUUID();
  await fs.mkdir(sessionPath(rootDir, id), { recursive: true });
  return { session: id };
}

export async function saveFrame(rootDir, id, index, req) {
  const frame = Number(index);
  if (!Number.isInteger(frame) || frame < 0 || frame > 99999) {
    throw fail(400, 'INVALID_FRAME', 'Frame index must be 0–99999.');
  }
  const directory = sessionPath(rootDir, id);
  await fs.stat(directory).catch(() => {
    throw fail(404, 'SESSION_NOT_FOUND', 'Export session not found.');
  });
  const name = `frame-${String(frame).padStart(5, '0')}.png`;
  await writeBody(req, path.join(directory, name), MAX_FRAME_BYTES);
  return { frame };
}

export async function discardSession(rootDir, id) {
  await fs.rm(sessionPath(rootDir, id), { force: true, recursive: true });
  return { discarded: id };
}

export async function countFrames(directory) {
  const names = await fs.readdir(directory).catch(() => []);
  return names.filter((name) => /^frame-\d{5}\.png$/u.test(name)).length;
}
