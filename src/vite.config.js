import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/eye-candy/',
  server: {
    https: true,
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.mp3', '**/*.mp4'],
});
