import {
  CatalogRequestError,
  readCatalog,
  readJsonBody,
  writeCatalog,
} from './service';
import { listSceneTodos, readSceneTodo, writeSceneTodo } from './todoService';

const CATALOG_PATH = '/dev-api/cataloggr';
const TODOS_PATH = '/dev-api/cataloggr/todos';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

async function handleRequest(res, handler) {
  try {
    sendJson(res, 200, await handler());
  } catch (error) {
    if (error instanceof CatalogRequestError) {
      sendJson(res, error.statusCode, {
        ok: false,
        code: error.code,
        message: error.message,
      });
      return;
    }

    sendJson(res, 500, {
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unexpected error.',
    });
  }
}

export default function cataloggrDevPlugin() {
  return {
    name: 'cataloggr-dev-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0];
        const rootDir = server.config.root;

        if (req.method === 'GET' && pathname === CATALOG_PATH) {
          await handleRequest(res, () => readCatalog(rootDir));
          return;
        }

        if (req.method === 'POST' && pathname === CATALOG_PATH) {
          await handleRequest(res, async () => {
            const payload = await readJsonBody(req);
            return writeCatalog({ payload, rootDir });
          });
          return;
        }

        if (req.method === 'GET' && pathname === TODOS_PATH) {
          await handleRequest(res, () => listSceneTodos(rootDir));
          return;
        }

        if (pathname === `${TODOS_PATH}/file`) {
          const sourcePath = new URL(
            req.url,
            'http://localhost'
          ).searchParams.get('sourcePath');

          if (req.method === 'GET') {
            await handleRequest(res, () => readSceneTodo(rootDir, sourcePath));
            return;
          }

          if (req.method === 'POST') {
            await handleRequest(res, async () => {
              const payload = await readJsonBody(req);
              return writeSceneTodo({ ...payload, rootDir, sourcePath });
            });
            return;
          }
        }

        next();
      });
    },
  };
}
