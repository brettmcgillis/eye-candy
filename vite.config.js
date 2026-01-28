// vite.config.js
import { defineConfig } from 'vite';

import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';

import pkg from './package.json';

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const useHttps = mode === 'https'; // 👈 custom mode

  return {
    plugins: [react(), useHttps && basicSsl()].filter(Boolean),

    // GitHub Pages base path ONLY for build
    base: isBuild ? '/eye-candy/' : '/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
      https: useHttps,
      host: true, // LAN access (phone testing)
      port: 3000,
      strictPort: true,
    },
  };
});
