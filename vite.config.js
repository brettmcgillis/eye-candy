// vite.config.js
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';

import os from 'os';
import path from 'path';
import { defineConfig } from 'vite';

import pkg from './package.json';
import devServerPlugins from './src/dev/server/devServerPlugins';

function getLanIP() {
  const interfaces = Object.values(os.networkInterfaces()).flatMap(
    (addrs) => addrs ?? []
  );

  return (
    interfaces.find((addr) => addr.family === 'IPv4' && !addr.internal)
      ?.address || 'localhost'
  );
}

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const useHttps = mode === 'https'; // 👈 custom mode

  // Dev: all clients (desktop + iOS) connect to Vite's address, which proxies
  // /parties/* to PartyKit on localhost:1999. This means:
  //   - one consistent room regardless of which IP the client used
  //   - no mixed-content block: HTTPS pages use wss:// to Vite, Vite forwards as ws:// internally
  // Prod: set VITE_PARTY_HOST to your deployed partykit.dev URL.
  const partyHost =
    process.env.VITE_PARTY_HOST ?? (isBuild ? '' : `${getLanIP()}:3000`);

  return {
    plugins: [
      react(),
      ...(!isBuild ? devServerPlugins() : []),
      useHttps && basicSsl(),
    ].filter(Boolean),

    resolve: {
      alias: {
        '@app': path.resolve(__dirname, 'src/app'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@dev': path.resolve(__dirname, 'src/dev'),
        '@elements': path.resolve(__dirname, 'src/components/elements'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@materials': path.resolve(__dirname, 'src/components/materials'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@postprocessing': path.resolve(
          __dirname,
          'src/components/postprocessing'
        ),
        '@presets': path.resolve(__dirname, 'src/presets'),
        '@scenes': path.resolve(__dirname, 'src/components/scenes'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },

    // GitHub Pages base path ONLY for build
    base: isBuild ? '/eye-candy/' : '/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __PARTY_HOST__: JSON.stringify(partyHost),
    },
    server: {
      https: useHttps,
      host: true, // LAN access (phone testing)
      port: 3000,
      strictPort: true,
      proxy: {
        '/parties': {
          target: 'http://localhost:1999',
          ws: true,
        },
      },
    },
  };
});
