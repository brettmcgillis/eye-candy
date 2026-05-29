// vite.config.js
import os from 'os';
import { defineConfig } from 'vite';

import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';

import pkg from './package.json';
import gltfjsxDevPlugin from './src/server/gltfjsxDevPlugin';

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
      !isBuild && gltfjsxDevPlugin(),
      useHttps && basicSsl(),
    ].filter(Boolean),

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
