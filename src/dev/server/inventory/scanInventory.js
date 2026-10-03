import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_ROOT = 'output';
const CURATED_ROOT = path.join('public', 'images');
const WORKBENCH_SUFFIX = '-workbench';
const DAY_MS = 24 * 60 * 60 * 1000;

const AGE_BUCKETS = [
  { id: 'day', label: 'Last 24h', maxMs: DAY_MS },
  { id: 'week', label: 'Last 7 days', maxMs: 7 * DAY_MS },
  { id: 'month', label: 'Last 30 days', maxMs: 30 * DAY_MS },
  { id: 'older', label: 'Older', maxMs: Infinity },
];

const CATEGORY_BY_EXT = {
  gif: 'image',
  jpeg: 'image',
  jpg: 'image',
  json: 'sidecar',
  mov: 'video',
  mp4: 'video',
  png: 'image',
  svg: 'vector',
  webm: 'video',
  webp: 'image',
};

const ARTIFACT_CATEGORIES = new Set(['image', 'vector', 'video']);

async function readDirSafe(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function walk(dir) {
  const entries = await readDirSafe(dir);
  const nested = await Promise.all(
    entries
      .filter((entry) => entry.name !== '.DS_Store')
      .map(async (entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        if (!entry.isFile()) return [];
        const { mtimeMs, size } = await fs.stat(full);
        return [{ full, mtimeMs, name: entry.name, size }];
      })
  );
  return nested.flat();
}

function describe(file, now) {
  const ext = path.extname(file.name).slice(1).toLowerCase() || '(none)';
  const category = CATEGORY_BY_EXT[ext] ?? 'other';
  const age = now - file.mtimeMs;
  return {
    ...file,
    artifact: ARTIFACT_CATEGORIES.has(category),
    bucket: AGE_BUCKETS.find((bucket) => age < bucket.maxMs).id,
    category,
    ext,
  };
}

function tallyBy(files, key) {
  return files.reduce((acc, file) => {
    const prev = acc[file[key]] ?? { bytes: 0, files: 0 };
    return {
      ...acc,
      [file[key]]: { bytes: prev.bytes + file.size, files: prev.files + 1 },
    };
  }, {});
}

function summarize(files) {
  const times = files.map((file) => file.mtimeMs);
  return {
    artifacts: files.filter((file) => file.artifact).length,
    byAge: tallyBy(files, 'bucket'),
    byCategory: tallyBy(files, 'category'),
    byType: tallyBy(files, 'ext'),
    bytes: files.reduce((sum, file) => sum + file.size, 0),
    files: files.length,
    newest: times.length ? Math.max(...times) : null,
    oldest: times.length ? Math.min(...times) : null,
  };
}

async function readManifest(jobDir) {
  try {
    const manifest = JSON.parse(
      await fs.readFile(path.join(jobDir, 'manifest.json'), 'utf8')
    );
    return {
      completedAt: manifest.completedAt ?? null,
      createdAt: manifest.createdAt ?? null,
      kind: manifest.kind ?? null,
      status: manifest.status ?? null,
    };
  } catch {
    return {};
  }
}

async function scanJobs(rootDir, group, files) {
  const jobsDir = path.join(rootDir, group.path, 'jobs');
  const keyed = files
    .map((file) => ({
      file,
      parts: path.relative(jobsDir, file.full).split(path.sep),
    }))
    .filter(({ parts }) => parts[0] !== '..' && parts.length > 1);
  const ids = [...new Set(keyed.map(({ parts }) => parts[0]))];

  return Promise.all(
    ids.map(async (id) => {
      const jobFiles = keyed
        .filter(({ parts }) => parts[0] === id)
        .map(({ file }) => file);
      const { artifacts, bytes, files: count, newest } = summarize(jobFiles);
      return {
        artifacts,
        bytes,
        files: count,
        group: group.id,
        id,
        label: group.label,
        newest,
        ...(await readManifest(path.join(jobsDir, id))),
      };
    })
  );
}

async function scanGroup(rootDir, group, now) {
  const files = (await walk(path.join(rootDir, group.path))).map((file) =>
    describe(file, now)
  );
  const jobs = await scanJobs(rootDir, group, files);
  return {
    files,
    group: { ...group, ...summarize(files), jobs: jobs.length },
    jobs,
  };
}

async function readDisk(rootDir) {
  if (typeof fs.statfs !== 'function') return null;
  const stat = await fs.statfs(rootDir);
  const total = stat.blocks * stat.bsize;
  const free = stat.bavail * stat.bsize;
  return { free, total, used: total - free };
}

export default async function scanInventory(rootDir) {
  const now = Date.now();
  const outputNames = (await readDirSafe(path.join(rootDir, OUTPUT_ROOT)))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const curatedNames = new Set(
    (await readDirSafe(path.join(rootDir, CURATED_ROOT)))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  );

  const outputGroups = outputNames.map((name) => {
    const label = name.endsWith(WORKBENCH_SUFFIX)
      ? name.slice(0, -WORKBENCH_SUFFIX.length)
      : name;
    return {
      id: `output:${name}`,
      label,
      path: path.join(OUTPUT_ROOT, name),
      root: 'output',
    };
  });
  // Kept media only counts for folders a workbench curates into.
  const curatedGroups = outputGroups
    .filter((group) => curatedNames.has(group.label))
    .map((group) => ({
      id: `curated:${group.label}`,
      label: group.label,
      path: path.join(CURATED_ROOT, group.label),
      root: 'curated',
    }));

  const scans = await Promise.all(
    [...outputGroups, ...curatedGroups].map((group) =>
      scanGroup(rootDir, group, now)
    )
  );
  const filesOf = (root) =>
    scans
      .filter((scan) => scan.group.root === root)
      .flatMap((scan) => scan.files);

  return {
    ageBuckets: AGE_BUCKETS.map(({ id, label }) => ({ id, label })),
    disk: await readDisk(rootDir),
    groups: scans.map((scan) => scan.group),
    jobs: scans.flatMap((scan) => scan.jobs),
    roots: {
      curated: { ...summarize(filesOf('curated')), path: CURATED_ROOT },
      output: { ...summarize(filesOf('output')), path: OUTPUT_ROOT },
    },
    scannedAt: now,
  };
}
