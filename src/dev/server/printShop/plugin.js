import path from 'node:path';

import createRenderJobService, {
  RenderJobRequestError,
} from '../renderJobs/jobService';
import createRenderJobPlugin, { streamAsset } from '../renderJobs/plugin';

const JOB_FILE = 'job.json';
const SAVED_ROOT = path.join('output', 'print-shop-workbench', 'saved');
const SAVED_URL = '/print-shop-saved';

// Validation lives in the CLI (it loads the printables through Vite); this
// only hands the page's request to scripts/print-shop-export.mjs as a job
// file in the collection, so a failed option surfaces as a failed job.
function prepare(rootDir, { outputDirectory, payload }) {
  const printable = String(payload.printable ?? '');
  if (!/^[a-z0-9-]+$/u.test(printable)) {
    throw new RenderJobRequestError(
      400,
      'INVALID_OPTION',
      'printable must name a PrintShop printable.'
    );
  }
  const options =
    payload.options && typeof payload.options === 'object'
      ? payload.options
      : {};
  return {
    args: [
      path.join(rootDir, 'scripts', 'print-shop-export.mjs'),
      '--job',
      path.join(rootDir, outputDirectory, JOB_FILE),
      '--out',
      path.join(rootDir, outputDirectory),
    ],
    files: {
      [JOB_FILE]: `${JSON.stringify({ options, printable }, null, 2)}\n`,
    },
    options: { ...options, printable },
  };
}

// Kept prints live under output/ (they are not for the public site), so the
// saved tree needs its own file route.
function savedFilesPlugin() {
  return {
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = decodeURIComponent(req.url?.split('?')[0] ?? '');
        if (!pathname.startsWith(`${SAVED_URL}/`)) {
          next();
          return;
        }
        const root = path.resolve(server.config.root, SAVED_ROOT);
        const file = path.resolve(root, pathname.slice(SAVED_URL.length + 1));
        if (!file.startsWith(`${root}${path.sep}`)) {
          res.statusCode = 403;
          res.end();
          return;
        }
        try {
          await streamAsset(req, res, next, file);
        } catch {
          res.statusCode = 404;
          res.end();
        }
      });
    },
    name: 'print-shop-saved-files',
  };
}

export default function printShopDevPlugin() {
  return [
    createRenderJobPlugin({
      service: createRenderJobService({
        curatedRoot: SAVED_ROOT,
        curatedUrl: SAVED_URL,
        itemFolders: true,
        kinds: ['export'],
        maxConcurrent: 1,
        outputRoot: path.join('output', 'print-shop-workbench', 'jobs'),
        prepare,
        tool: 'print-shop',
      }),
      tool: 'print-shop',
    }),
    savedFilesPlugin(),
  ];
}
