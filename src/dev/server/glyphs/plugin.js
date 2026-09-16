import { FontRequestError, listFonts, writeFont } from './fontStore';

const FONTS_API = '/dev-api/glyphs/fonts';
const MAX_BODY_BYTES = 512 * 1024;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let failed = false;

    req.on('data', (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        failed = true;
        reject(new FontRequestError(413, 'Request is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (failed) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new FontRequestError(400, 'Request body must be JSON.'));
      }
    });
    req.on('error', reject);
  });
}

async function handleJson(res, handler) {
  try {
    sendJson(res, 200, { ok: true, ...(await handler()) });
  } catch (error) {
    const known = error instanceof FontRequestError;
    sendJson(res, known ? error.statusCode : 500, {
      message: error instanceof Error ? error.message : 'Unexpected error.',
      ok: false,
    });
  }
}

export default function glyphsDevPlugin() {
  return {
    apply: 'serve',
    name: 'glyphs-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        const rootDir = server.config.root;

        if (pathname === FONTS_API && req.method === 'GET') {
          await handleJson(res, async () => ({
            fonts: await listFonts(rootDir),
          }));
          return;
        }

        if (pathname === FONTS_API && req.method === 'POST') {
          await handleJson(res, async () => {
            const body = await readJsonBody(req);
            return writeFont(rootDir, body.font);
          });
          return;
        }

        next();
      });
    },
  };
}
