import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Uploaded source images live under public/ so the CLI resolves them by the
// same `images/…` path the scene fetches. Content-addressed, so uploading
// the same picture twice is one file.
const DIRECTORY = path.join('images', 'subdivision-sources');
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const EXTENSIONS = new Set(Object.values(TYPES));

export const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;

export async function saveSource(rootDir, { dataUrl }) {
  const match = /^data:([^;]+);base64,(.+)$/su.exec(String(dataUrl ?? ''));
  const extension = match && TYPES[match[1]];
  if (!extension) throw new Error('Upload a PNG, JPEG or WebP image.');
  const bytes = Buffer.from(match[2], 'base64');
  const name = `${createHash('sha1').update(bytes).digest('hex').slice(0, 12)}.${extension}`;
  const directory = path.join(rootDir, 'public', DIRECTORY);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, name), bytes);
  return { path: `${DIRECTORY}/${name}` };
}

export async function listSources(rootDir) {
  const directory = path.join(rootDir, 'public', DIRECTORY);
  const files = await fs.readdir(directory).catch(() => []);
  return {
    sources: files
      .filter((file) => EXTENSIONS.has(file.split('.').pop()))
      .sort()
      .map((file) => `${DIRECTORY}/${file}`),
  };
}
