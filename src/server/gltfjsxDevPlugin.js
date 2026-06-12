import {
  RequestError,
  convertGltfJsxRequest,
  getGltfJsxCapabilities,
  listModelAssets,
  readJsonBody,
  writeModelAssetRequest,
} from './gltfjsxService';

const CAPABILITIES_PATH = '/dev-api/gltfjsx/capabilities';
const CONVERT_PATH = '/dev-api/gltfjsx/convert';
const MODELS_PATH = '/dev-api/gltfjsx/models';
const WRITE_ASSET_PATH = '/dev-api/gltfjsx/write-asset';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

async function handleRequest(res, handler) {
  try {
    const payload = await handler();
    sendJson(res, 200, payload);
  } catch (error) {
    if (error instanceof RequestError) {
      sendJson(res, error.statusCode, {
        ok: false,
        code: error.code,
        details: error.details ?? null,
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

export default function gltfjsxDevPlugin() {
  return {
    name: 'gltfjsx-dev-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0];
        const rootDir = server.config.root;

        if (req.method === 'GET' && pathname === CAPABILITIES_PATH) {
          await handleRequest(res, () => getGltfJsxCapabilities(rootDir));
          return;
        }

        if (req.method === 'GET' && pathname === MODELS_PATH) {
          await handleRequest(res, () => listModelAssets(rootDir));
          return;
        }

        if (req.method === 'POST' && pathname === CONVERT_PATH) {
          await handleRequest(res, async () => {
            const body = await readJsonBody(req);
            return convertGltfJsxRequest({ payload: body, rootDir });
          });
          return;
        }

        if (req.method === 'POST' && pathname === WRITE_ASSET_PATH) {
          await handleRequest(res, async () => {
            const body = await readJsonBody(req);
            return writeModelAssetRequest({ payload: body, rootDir });
          });
          return;
        }

        next();
      });
    },
  };
}
