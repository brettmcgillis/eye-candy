import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = '/dev-api/paper-cuts-designer/designs';
const DIRECTORY = 'src/modules/paperCuts/designs';
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/u;
async function bodyOf(req) {
  const chunks = [];
  let size = 0;
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256 * 1024) throw new Error('Design exceeds 256 KB.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export default function paperCutsDesignerPlugin() {
  return {
    apply: 'serve',
    name: 'paper-cuts-designer',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (pathname !== API && !pathname.startsWith(`${API}/`)) {
          next();
          return;
        }
        let status = 200;
        let result;
        try {
          const { designToJson, normalizeDesign } = await server.ssrLoadModule(
            '/src/modules/paperCuts/index.js'
          );
          const directory = path.join(server.config.root, DIRECTORY);
          const name = decodeURIComponent(pathname.slice(API.length + 1));
          if (!name && req.method === 'GET') {
            const files = await readdir(directory).catch(() => []);
            const designs = await Promise.all(
              files
                .filter((file) => file.endsWith('.json'))
                .sort()
                .map(async (file) => {
                  const design = normalizeDesign(
                    JSON.parse(
                      await readFile(path.join(directory, file), 'utf8')
                    )
                  );
                  return {
                    name: file.slice(0, -5),
                    pieces: design.pieces.length,
                    layers: design.layerCount,
                  };
                })
            );
            result = { designs };
          } else {
            if (!NAME.test(name))
              throw new Error(
                'Names use lowercase letters, digits and dashes (1–64 characters).'
              );
            const file = path.join(directory, `${name}.json`);
            if (req.method === 'GET')
              result = { design: JSON.parse(await readFile(file, 'utf8')) };
            else if (req.method === 'PUT') {
              const json = designToJson(await bodyOf(req));
              await mkdir(directory, { recursive: true });
              await writeFile(
                file,
                `${JSON.stringify({ name, ...json }, null, 2)}\n`
              );
              result = { name };
            } else if (req.method === 'DELETE') {
              await rm(file, { force: true });
              result = { name };
            } else {
              status = 405;
              throw new Error('Method not allowed.');
            }
          }
          result = { ok: true, ...result };
        } catch (error) {
          status = error.code === 'ENOENT' ? 404 : Math.max(status, 400);
          result = { ok: false, message: error.message };
        }
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result));
      });
    },
  };
}
