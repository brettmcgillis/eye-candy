import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Uploaded source images live under public/ so the CLI resolves them by the
// same `images/…` path the scene fetches. Content-addressed, so uploading
// the same picture twice is one file.
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const EXTENSIONS = new Set(Object.values(TYPES));

const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;

async function saveSource(rootDir, directory, { dataUrl }) {
  const match = /^data:([^;]+);base64,(.+)$/su.exec(String(dataUrl ?? ''));
  const extension = match && TYPES[match[1]];
  if (!extension) throw new Error('Upload a PNG, JPEG or WebP image.');
  const bytes = Buffer.from(match[2], 'base64');
  const name = `${createHash('sha1').update(bytes).digest('hex').slice(0, 12)}.${extension}`;
  const target = path.join(rootDir, 'public', directory);
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, name), bytes);
  return { path: `${directory}/${name}` };
}

async function listSources(rootDir, directory) {
  const files = await fs
    .readdir(path.join(rootDir, 'public', directory))
    .catch(() => []);
  return {
    sources: files
      .filter((file) => EXTENSIONS.has(file.split('.').pop()))
      .sort()
      .map((file) => `${directory}/${file}`),
  };
}

// GET/POST `/sources` for a schema tool plugin's `routes`; `directory` is
// under public/ and may be shared between tools.
export default function sourceImageRoutes(directory) {
  return [
    {
      handler: (rootDir) => listSources(rootDir, directory),
      method: 'GET',
      path: '/sources',
    },
    {
      handler: (rootDir, body) => saveSource(rootDir, directory, body),
      maxBytes: MAX_UPLOAD_BYTES,
      method: 'POST',
      path: '/sources',
    },
  ];
}
