import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  DEFAULT_PENS,
  JOB_VERSION,
  jobDxfs,
  jobSvg,
} from '../../tools/plotterizer/kernel/index.mjs';
import { RenderJobRequestError } from '../renderJobs/jobService';
import { handleJson, readJsonBody, streamAsset } from '../renderJobs/plugin';
import createPlotter from './plotter';
import listSources from './sources';

const API = '/dev-api/plotterizer';
const OUTPUT = 'output';
const HOME = path.join(OUTPUT, 'plotterizer');
const JOBS = path.join(HOME, 'jobs');
const PENS = path.join(HOME, 'pens.json');
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/u;
const MAX_JOB_BYTES = 400 * 1024 * 1024;

const fail = (status, code, message) => {
  throw new RenderJobRequestError(status, code, message);
};

const ROOTS = [OUTPUT, path.join('public', 'images')];

function sourceFile(root, relative) {
  const file = path.resolve(root, String(relative ?? ''));
  const inRoot = ROOTS.some((dir) =>
    file.startsWith(`${path.join(root, dir)}${path.sep}`)
  );
  const plot = file.endsWith('.svg') || path.basename(file) === 'props.json';
  if (!inRoot || !plot) {
    fail(
      400,
      'INVALID_SOURCE',
      'Sources are SVGs (or their props.json) under output/ or public/images/.'
    );
  }
  return file;
}

async function readPens(root) {
  try {
    return JSON.parse(await readFile(path.join(root, PENS), 'utf8'));
  } catch {
    return DEFAULT_PENS;
  }
}

function checkPens(pens) {
  const valid =
    Array.isArray(pens) &&
    pens.every(
      (pen) =>
        typeof pen.id === 'string' &&
        typeof pen.name === 'string' &&
        /^#[0-9a-f]{6}$/iu.test(pen.color) &&
        pen.nibMm > 0
    );
  if (!valid) fail(400, 'INVALID_PENS', 'Pens are { id, name, color, nibMm }.');
}

const jobDir = (root, slug) => {
  if (!SLUG.test(slug)) {
    fail(400, 'INVALID_NAME', 'Job names are lowercase letters, digits, -.');
  }
  return path.join(root, JOBS, slug);
};

const fileUrl = (slug, file) =>
  `${API}/jobs/${slug}/files/${encodeURIComponent(file)}`;

function summaryOf(slug, job, files) {
  return {
    createdAt: job.createdAt,
    files: files.map((file) => ({ file, url: fileUrl(slug, file) })),
    name: job.name,
    paper: job.paper,
    passes: job.passes.map(({ layers, pen, stats }) => ({
      layers,
      pen,
      stats,
    })),
    slug,
    source: job.source,
  };
}

async function saveJob(root, slug, job) {
  if (job?.version !== JOB_VERSION || !Array.isArray(job.passes)) {
    fail(400, 'INVALID_JOB', `Jobs are plotterizer v${JOB_VERSION} JSON.`);
  }
  const dir = jobDir(root, slug);
  await rm(dir, { force: true, recursive: true });
  await mkdir(dir, { recursive: true });
  const dxfs = jobDxfs(job);
  const written = [
    { file: 'job.json', text: JSON.stringify(job) },
    { file: 'plot.svg', text: jobSvg(job) },
    ...dxfs,
  ];
  await Promise.all(
    written.map(({ file, text }) => writeFile(path.join(dir, file), text))
  );
  const summary = summaryOf(
    slug,
    job,
    written.map(({ file }) => file)
  );
  await writeFile(path.join(dir, 'summary.json'), JSON.stringify(summary));
  return summary;
}

async function listJobs(root) {
  const dir = path.join(root, JOBS);
  const slugs = await readdir(dir).catch(() => []);
  const summaries = await Promise.all(
    slugs.map((slug) =>
      readFile(path.join(dir, slug, 'summary.json'), 'utf8')
        .then(JSON.parse)
        .catch(() => null)
    )
  );
  return summaries
    .filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function plotterizerDevPlugin() {
  return {
    apply: 'serve',
    name: 'plotterizer-dev-plugin',
    configureServer(server) {
      const plotter = createPlotter(server.config.root);
      server.middlewares.use(async (req, res, next) => {
        const [pathname, query = ''] = (req.url ?? '').split('?');
        if (!pathname.startsWith(API)) {
          next();
          return;
        }
        const { root } = server.config;
        const { method } = req;
        const route = pathname.slice(API.length);

        if (route === '/source' && method === 'GET') {
          try {
            const file = sourceFile(
              root,
              new URLSearchParams(query).get('path')
            );
            await streamAsset(req, res, next, file);
          } catch (error) {
            await handleJson(res, () => Promise.reject(error));
          }
          return;
        }
        const fileMatch = /^\/jobs\/([^/]+)\/files\/([^/]+)$/u.exec(route);
        if (fileMatch && ['GET', 'HEAD'].includes(method)) {
          try {
            const dir = jobDir(root, fileMatch[1]);
            const name = path.basename(decodeURIComponent(fileMatch[2]));
            await streamAsset(req, res, next, path.join(dir, name));
          } catch (error) {
            await handleJson(res, () =>
              Promise.reject(
                error.code === 'ENOENT'
                  ? new RenderJobRequestError(404, 'NOT_FOUND', 'No such file.')
                  : error
              )
            );
          }
          return;
        }

        await handleJson(res, async () => {
          if (route === '/plotter' && method === 'GET') {
            const detect = new URLSearchParams(query).has('detect');
            return {
              cutter: detect ? await plotter.detect() : null,
              plotter: plotter.state(),
            };
          }
          if (route === '/plotter/start' && method === 'POST') {
            return { plotter: await plotter.start(await readJsonBody(req)) };
          }
          if (route === '/plotter/continue' && method === 'POST') {
            return { plotter: plotter.resume() };
          }
          if (route === '/plotter/cancel' && method === 'POST') {
            return { plotter: await plotter.cancel() };
          }
          if (route === '/plotter/test' && method === 'POST') {
            return { plotter: await plotter.test(await readJsonBody(req)) };
          }
          if (route === '/sources' && method === 'GET') {
            return { sources: await listSources(root) };
          }
          if (route === '/pens' && method === 'GET') {
            return { pens: await readPens(root) };
          }
          if (route === '/pens' && method === 'PUT') {
            const { pens } = await readJsonBody(req);
            checkPens(pens);
            await mkdir(path.join(root, HOME), { recursive: true });
            await writeFile(
              path.join(root, PENS),
              `${JSON.stringify(pens, null, 2)}\n`
            );
            return { pens };
          }
          if (route === '/jobs' && method === 'GET') {
            return { jobs: await listJobs(root) };
          }
          const jobMatch = /^\/jobs\/([^/]+)$/u.exec(route);
          if (jobMatch && method === 'PUT') {
            const job = await readJsonBody(req, MAX_JOB_BYTES);
            return { job: await saveJob(root, jobMatch[1], job) };
          }
          if (jobMatch && method === 'DELETE') {
            await rm(jobDir(root, jobMatch[1]), {
              force: true,
              recursive: true,
            });
            return { deleted: jobMatch[1] };
          }
          return fail(404, 'NOT_FOUND', 'No such Plotterizer route.');
        });
      });
    },
  };
}
