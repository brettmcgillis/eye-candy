import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

import createCapturer from './scripts/lib/gpuCapture.mjs';
import {
  buildTest,
  loadSceneModules,
  renderFrame,
} from './scripts/lib/rorschachRender.mjs';

const S = '/src/components/scenes/WorkInProgress/WebGPU/Rorschach';
const W = 800,
  H = 800;
await mkdir('output', { recursive: true });

// preset 005 straight from the scene's presets
const server = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
  root: process.cwd(),
  server: { middlewareMode: true },
});
const { PRESETS } = await server.ssrLoadModule(`${S}/presets/presets.js`);
const geom = await server.ssrLoadModule(`${S}/utils/buildStrokeGeometry.js`);
await server.close();
const config = PRESETS['005'];

const options = {
  bloom: true,
  bloomRadius: config.bloomRadius,
  bloomStrength: config.bloomStrength,
  bloomThreshold: config.bloomThreshold,
  distance: 22,
  flatten: config.flatten,
  flattenAxis: config.flattenAxis,
  fov: 42,
  height: H,
  width: W,
  simplify: 0.4,
  stroke: 0,
  overlay: false,
  version: '0.1.0',
};

const modules = await loadSceneModules();
const test = buildTest(modules, config);
console.log(
  'bundles:',
  test.bundles.length,
  '| emissive:',
  test.styles.map((s, i) => (s.emissive ? i : null)).filter((v) => v !== null)
);
console.log(
  'bloom: strength',
  config.bloomStrength,
  'threshold',
  config.bloomThreshold,
  'radius',
  config.bloomRadius
);

console.log('\nrendering SVG path...');
const t0 = Date.now();
const svgPng = await renderFrame(modules, {
  config,
  options,
  test,
  view: 'front',
});
await writeFile('output/005-svg.png', svgPng);
console.log('  ', Date.now() - t0, 'ms');

console.log('rendering GPU path...');
const t1 = Date.now();
const cap = await createCapturer({ width: W, height: H });
const gpuPng = await cap.capture({
  config,
  geometryHelpers: geom,
  options,
  test,
  eye: [0, 0, 22],
  target: [0, 0, 0],
});
await writeFile('output/005-gpu.png', gpuPng);
console.log('  ', Date.now() - t1, 'ms');
cap.dispose();
process.exit(0);
