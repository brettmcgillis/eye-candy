import fs from 'node:fs/promises';
import path from 'node:path';

import { CatalogRequestError } from './service';

const SCENES_PATH = path.join('src', 'components', 'scenes');
const VISIBILITY_FILE = path.join('presets', 'visibility.json');
const SCENE_SOURCE_PATTERN =
  /^src\/components\/scenes\/(?:WebGL|WebGPU|Shared)\/[A-Za-z0-9_-]+$/u;
const MAX_PRESET_NAME_CHARS = 200;
const VISIBILITY_STATES = ['public', 'private'];

function getVisibilityPath(rootDir, sourcePath) {
  if (!SCENE_SOURCE_PATTERN.test(String(sourcePath ?? ''))) {
    throw new CatalogRequestError(
      400,
      'INVALID_SOURCE_PATH',
      'Preset visibility can only belong to a scene folder.'
    );
  }

  return path.join(rootDir, ...sourcePath.split('/'), VISIBILITY_FILE);
}

function sortedNames(names) {
  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

function normalizeVisibility(value) {
  return Object.fromEntries(
    VISIBILITY_STATES.map((state) => [
      state,
      sortedNames(Array.isArray(value?.[state]) ? value[state] : []),
    ])
  );
}

async function readVisibilityFile(filePath) {
  try {
    return normalizeVisibility(JSON.parse(await fs.readFile(filePath, 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') return normalizeVisibility({});
    throw error;
  }
}

export async function listPresetVisibility(rootDir) {
  const scenesPath = path.join(rootDir, SCENES_PATH);
  const relativePaths = await fs.readdir(scenesPath, { recursive: true });
  const visibilityPaths = relativePaths.filter((relativePath) =>
    /^(?:WebGL|WebGPU|Shared)\/[^/]+\/presets\/visibility\.json$/u.test(
      relativePath.split(path.sep).join('/')
    )
  );

  const entries = await Promise.all(
    visibilityPaths.map(async (relativePath) => {
      const segments = relativePath.split(path.sep).slice(0, 2);
      return [
        path.posix.join('src', 'components', 'scenes', ...segments),
        await readVisibilityFile(path.join(scenesPath, relativePath)),
      ];
    })
  );

  return Object.fromEntries(
    entries.sort(([left], [right]) => left.localeCompare(right))
  );
}

export async function writePresetVisibility({
  presetName,
  rootDir,
  sourcePath,
  visibility,
}) {
  const filePath = getVisibilityPath(rootDir, sourcePath);
  const name = String(presetName ?? '').trim();

  if (!name || name.length > MAX_PRESET_NAME_CHARS) {
    throw new CatalogRequestError(
      400,
      'INVALID_PRESET_NAME',
      'A preset name is required.'
    );
  }

  if (visibility !== null && !VISIBILITY_STATES.includes(visibility)) {
    throw new CatalogRequestError(
      400,
      'INVALID_VISIBILITY',
      'Visibility must be "public", "private" or null.'
    );
  }

  const current = await readVisibilityFile(filePath);
  const next = Object.fromEntries(
    VISIBILITY_STATES.map((state) => [
      state,
      sortedNames([
        ...current[state].filter((entry) => entry !== name),
        ...(state === visibility ? [name] : []),
      ]),
    ])
  );

  if (VISIBILITY_STATES.every((state) => !next[state].length)) {
    await fs.rm(filePath, { force: true });
  } else {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`);
  }

  return { ok: true, sourcePath, visibility: next };
}
