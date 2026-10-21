import { createHash } from 'node:crypto';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
// eslint-disable-next-line import/no-extraneous-dependencies
import sharp from 'sharp';

export const THUMB_ROOTS = ['output', path.join('public', 'images')];
const CACHE = path.join('output', '.thumbs');
const RASTER = ['.webp', '.png', '.jpg'];
const MAX_SIZE = 1024;
const AT_ONCE = 2;

const exists = (file) =>
  stat(file).then(
    (info) => info,
    () => null
  );

// A repo-relative media path under output/ or public/images/, or null.
export function mediaFile(root, relative) {
  const file = path.resolve(root, String(relative ?? ''));
  const inRoot = THUMB_ROOTS.some((dir) =>
    file.startsWith(`${path.join(root, dir)}${path.sep}`)
  );
  const media = ['.svg', ...RASTER].includes(path.extname(file).toLowerCase());
  return inRoot && media && !file.includes(`${path.sep}.thumbs${path.sep}`)
    ? file
    : null;
}

// Small WebP stand-ins for plots that are too heavy to show as <img>
// (a dense SVG is megabytes of path). A plot with a PNG or WebP beside it
// is thumbnailed from that; otherwise the SVG is rasterized once. Cached
// by path, modification time and size; two renders at a time.
export default function createThumbnailer(root) {
  const pending = new Map();
  const queue = [];
  let running = 0;

  // Each finished render starts the next queued one.
  const start = () => {
    if (running >= AT_ONCE || !queue.length) return;
    running += 1;
    queue
      .shift()()
      .finally(() => {
        running -= 1;
        start();
      });
    start();
  };

  async function render(file, target, size) {
    const stem = file.slice(0, -path.extname(file).length);
    const siblings = await Promise.all(
      RASTER.map(async (ext) =>
        (await exists(stem + ext)) ? stem + ext : null
      )
    );
    const source =
      path.extname(file) === '.svg' ? siblings.find(Boolean) : file;
    const input = source
      ? sharp(source)
      : sharp(file, { density: 48, limitInputPixels: false });
    await input
      .resize({ fit: 'inside', height: size, width: size })
      .flatten({ background: '#ffffff' })
      .webp({ quality: 72 })
      .toFile(target);
  }

  return async function thumbnail(relative, requested = 320) {
    const file = mediaFile(root, relative);
    if (!file)
      throw new Error(
        'Thumbnails are of media under output/ or public/images/.'
      );
    const info = await exists(file);
    if (!info) throw new Error('No such file.');
    const size = Math.min(MAX_SIZE, Math.max(32, Math.round(requested)));
    const key = createHash('sha1')
      .update(`${relative}|${info.mtimeMs}|${size}`)
      .digest('hex');
    const target = path.join(root, CACHE, `${key}.webp`);
    if (await exists(target)) return target;
    if (!pending.has(key)) {
      pending.set(
        key,
        new Promise((resolve, reject) => {
          queue.push(async () => {
            try {
              await mkdir(path.dirname(target), { recursive: true });
              await render(file, target, size);
              resolve(target);
            } catch (error) {
              reject(error);
            } finally {
              pending.delete(key);
            }
          });
          start();
        })
      );
    }
    return pending.get(key);
  };
}
