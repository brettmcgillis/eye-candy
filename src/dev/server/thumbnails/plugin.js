import fs from 'node:fs';

import createThumbnailer from './thumbnails';

const API = '/dev-api/thumbs';

// GET /dev-api/thumbs?path=<repo-relative media>&size=<px>: a cached WebP.
export default function thumbnailsDevPlugin() {
  return {
    apply: 'serve',
    name: 'thumbnails-dev-plugin',
    configureServer(server) {
      const thumbnail = createThumbnailer(server.config.root);
      server.middlewares.use(async (req, res, next) => {
        const [pathname, query = ''] = (req.url ?? '').split('?');
        if (pathname !== API) {
          next();
          return;
        }
        const params = new URLSearchParams(query);
        try {
          const file = await thumbnail(
            params.get('path'),
            Number(params.get('size')) || 320
          );
          res.setHeader('Content-Type', 'image/webp');
          res.setHeader('Cache-Control', 'private, max-age=86400');
          fs.createReadStream(file).on('error', next).pipe(res);
        } catch (error) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(error.message);
        }
      });
    },
  };
}
