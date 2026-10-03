import createRenderJobPlugin, {
  handleJson,
  streamAsset,
} from '../renderJobs/plugin';
import service from './jobService';
import {
  createSession,
  deleteSource,
  discardSession,
  listSources,
  saveFrame,
  saveSource,
  sourcePath,
} from './storage';

const BASE = '/dev-api/darkroom';
const SOURCE = new RegExp(`^${BASE}/sources/([^/]+)$`, 'u');
const FRAME = new RegExp(`^${BASE}/sessions/([^/]+)/frames/(\\d+)$`, 'u');
const SESSION = new RegExp(`^${BASE}/sessions/([^/]+)$`, 'u');

// Uploads are raw bodies (a clip is far past any JSON limit), so these
// routes sit in front of the shared job surface.
export default function darkroomDevPlugin() {
  const jobs = createRenderJobPlugin({ service, tool: 'darkroom' });

  return {
    name: 'darkroom-dev-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (!pathname.startsWith(BASE)) {
          next();
          return;
        }
        const rootDir = server.config.root;
        const { method } = req;
        const json = (handler) => handleJson(res, handler);

        if (pathname === `${BASE}/sources`) {
          if (method === 'GET') {
            await json(() => listSources(rootDir));
            return;
          }
          if (method === 'POST') {
            await json(() => saveSource(rootDir, req));
            return;
          }
        }
        const source = pathname.match(SOURCE);
        if (source && ['GET', 'HEAD'].includes(method)) {
          try {
            await streamAsset(req, res, next, sourcePath(rootDir, source[1]));
          } catch {
            res.statusCode = 404;
            res.end();
          }
          return;
        }
        if (source && method === 'DELETE') {
          await json(() => deleteSource(rootDir, source[1]));
          return;
        }
        if (pathname === `${BASE}/sessions` && method === 'POST') {
          await json(() => createSession(rootDir));
          return;
        }
        const frame = pathname.match(FRAME);
        if (frame && method === 'PUT') {
          await json(() => saveFrame(rootDir, frame[1], frame[2], req));
          return;
        }
        const session = pathname.match(SESSION);
        if (session && method === 'DELETE') {
          await json(() => discardSession(rootDir, session[1]));
          return;
        }
        next();
      });
      jobs.configureServer(server);
    },
  };
}
