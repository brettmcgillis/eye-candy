import scanInventory from './scanInventory';

const INVENTORY_API = '/dev-api/inventory';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default function inventoryDevPlugin() {
  return {
    apply: 'serve',
    name: 'inventory-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (pathname !== INVENTORY_API || req.method !== 'GET') {
          next();
          return;
        }
        try {
          sendJson(res, 200, {
            ok: true,
            ...(await scanInventory(server.config.root)),
          });
        } catch (error) {
          sendJson(res, 500, {
            message: error instanceof Error ? error.message : 'Scan failed.',
            ok: false,
          });
        }
      });
    },
  };
}
