import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { CatalogRequestError } from './service';

const SCREENSHOT_DIR = 'screenshots';
const MANIFEST_FILE = 'screenshots.json';
const FILE_PATTERN = /^[a-f0-9]{10}\.webp$/u;
const MAX_CAPTION_CHARS = 200;
const MAX_SCREENSHOTS = 24;
const SOURCE_PATH_PATTERN =
  /^src\/(?:components\/scenes\/(?:WebGL|WebGPU|Shared)|dev\/tools)\/[A-Za-z0-9_-]+$/u;
const WEBP_SIGNATURE = [
  [0, 'RIFF'],
  [8, 'WEBP'],
];

async function getFolders(rootDir, sourcePath) {
  if (!SOURCE_PATH_PATTERN.test(String(sourcePath ?? ''))) {
    throw new CatalogRequestError(
      400,
      'INVALID_SOURCE_PATH',
      'Screenshots can only belong to a scene or dev tool folder.'
    );
  }

  const sceneFolder = path.join(rootDir, ...sourcePath.split('/'));

  try {
    if (!(await fs.stat(sceneFolder)).isDirectory()) throw new Error();
  } catch {
    throw new CatalogRequestError(
      404,
      'SOURCE_NOT_FOUND',
      `No folder exists at ${sourcePath}.`
    );
  }

  return {
    folder: path.join(sceneFolder, SCREENSHOT_DIR),
    manifestPath: path.join(sceneFolder, SCREENSHOT_DIR, MANIFEST_FILE),
  };
}

async function readManifest(manifestPath) {
  try {
    const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    if (Array.isArray(parsed)) return { mainCaption: '', screenshots: parsed };
    return {
      mainCaption: parsed.mainCaption ?? '',
      screenshots: parsed.screenshots ?? [],
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { mainCaption: '', screenshots: [] };
    throw error;
  }
}

async function writeManifest(folder, manifestPath, manifest) {
  const { mainCaption, screenshots } = manifest;
  const keep = new Set(screenshots.map((shot) => shot.file));
  let existing = [];

  try {
    existing = await fs.readdir(folder);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await Promise.all(
    existing
      .filter((name) => FILE_PATTERN.test(name) && !keep.has(name))
      .map((name) => fs.rm(path.join(folder, name), { force: true }))
  );

  if (!screenshots.length && !mainCaption) {
    await fs.rm(folder, { recursive: true, force: true });
    return;
  }

  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify({ mainCaption, screenshots }, null, 2)}\n`
  );
}

export async function listScreenshots(rootDir, sourcePath) {
  const { manifestPath } = await getFolders(rootDir, sourcePath);
  return { sourcePath, ...(await readManifest(manifestPath)) };
}

export async function readScreenshotFile(rootDir, sourcePath, file) {
  const { folder } = await getFolders(rootDir, sourcePath);

  if (!FILE_PATTERN.test(String(file ?? ''))) {
    throw new CatalogRequestError(
      400,
      'INVALID_SCREENSHOT',
      'Unknown screenshot file.'
    );
  }

  try {
    return await fs.readFile(path.join(folder, file));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new CatalogRequestError(
      404,
      'SCREENSHOT_NOT_FOUND',
      `${sourcePath} has no screenshot ${file}.`
    );
  }
}

export async function addScreenshot({ body, rootDir, sourcePath }) {
  const isWebp = WEBP_SIGNATURE.every(
    ([offset, text]) =>
      body.subarray(offset, offset + text.length).toString('ascii') === text
  );

  if (!isWebp) {
    throw new CatalogRequestError(
      415,
      'SCREENSHOT_NOT_WEBP',
      'Screenshots must be uploaded as WebP.'
    );
  }

  const { folder, manifestPath } = await getFolders(rootDir, sourcePath);
  const manifest = await readManifest(manifestPath);
  const { screenshots } = manifest;

  if (screenshots.length >= MAX_SCREENSHOTS) {
    throw new CatalogRequestError(
      400,
      'TOO_MANY_SCREENSHOTS',
      `A scene can have at most ${MAX_SCREENSHOTS} screenshots.`
    );
  }

  const file = `${crypto.randomBytes(5).toString('hex')}.webp`;
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, file), body);
  const next = {
    ...manifest,
    screenshots: [...screenshots, { file, caption: '' }],
  };
  await writeManifest(folder, manifestPath, next);

  return { ok: true, sourcePath, ...next };
}

export async function writeScreenshots({
  mainCaption = '',
  rootDir,
  screenshots,
  sourcePath,
}) {
  const { folder, manifestPath } = await getFolders(rootDir, sourcePath);
  const current = new Set(
    (await readManifest(manifestPath)).screenshots.map((shot) => shot.file)
  );

  const valid =
    typeof mainCaption === 'string' &&
    mainCaption.length <= MAX_CAPTION_CHARS &&
    Array.isArray(screenshots) &&
    screenshots.every(
      (shot) =>
        current.has(shot?.file) &&
        typeof shot.caption === 'string' &&
        shot.caption.length <= MAX_CAPTION_CHARS
    ) &&
    new Set(screenshots.map((shot) => shot.file)).size === screenshots.length;

  if (!valid) {
    throw new CatalogRequestError(
      400,
      'INVALID_SCREENSHOTS',
      'Screenshots must reorder or delete existing files, with captions up to 200 characters.'
    );
  }

  const next = {
    mainCaption: mainCaption.trim(),
    screenshots: screenshots.map(({ file, caption }) => ({
      file,
      caption: caption.trim(),
    })),
  };
  await writeManifest(folder, manifestPath, next);

  return { ok: true, sourcePath, ...next };
}
