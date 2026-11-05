/* eslint-disable import/no-extraneous-dependencies, no-restricted-syntax, no-await-in-loop, no-continue */
import React from 'react';
import { renderToString } from 'react-dom/server';

import { parse } from '@babel/parser';

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

import { REPO_ROOT } from './loadModules.mjs';
import presetSource from './presetSource.mjs';

const BRIDGE = '/scripts/lib/presetLeva.mjs';

function presetCollectionName(source) {
  const ast = parse(source, { sourceType: 'module' });
  let name;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'CallExpression' &&
      node.callee.name === 'usePresetsFolder'
    ) {
      name = node.arguments[0].properties.find(
        (item) => item.key?.name === 'presets'
      )?.value?.name;
    }
    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    });
  }
  visit(ast.program);
  return name;
}

export default async function auditPresets({ scenes } = {}) {
  const config = JSON.parse(
    await readFile(path.join(REPO_ROOT, 'jsconfig.json'))
  );
  const alias = Object.entries(config.compilerOptions.paths)
    .filter(([name]) => !name.endsWith('/*'))
    .map(([name, [target]]) => ({
      find: new RegExp(`^${name}(?=/|$)`, 'u'),
      replacement: path.join(REPO_ROOT, target),
    }));
  const plugin = {
    name: 'preset-control-audit',
    enforce: 'pre',
    resolveId(id) {
      if (id === '@mediapipe/drawing_utils') return '\0preset-drawing';
      if (id === 'three-bvh-csg') return '\0preset-csg';
      if (id === 'leva') return path.join(REPO_ROOT, BRIDGE);
      if (id.endsWith('/modules/mediaRecorder')) return '\0preset-recorder';
      return null;
    },
    load(id) {
      if (id === '\0preset-drawing') {
        return 'export const drawConnectors = () => {}; export const drawLandmarks = () => {};';
      }
      if (id === '\0preset-csg') {
        return 'export class Evaluator {} export class Brush {} export const ADDITION = 0;';
      }
      if (id === '\0preset-recorder') {
        return 'export function useMediaRecorder() { return { takeScreenshot() {} }; }';
      }
      return null;
    },
    transform(code, id) {
      if (id.endsWith('/hooks/usePresetsFolder.js')) {
        return `import {capturePresets} from '${BRIDGE}';\n${code.replace(
          '  const local = localEnv();',
          '  capturePresets({ defaultPreset, getPresetControls, presets });\n  const local = localEnv();'
        )}`;
      }
      if (id.endsWith('/utils/appUtils.js')) {
        return code.replace(
          'return isLocalHost() && !testMode();',
          'return false;'
        );
      }
      if (id.endsWith('/utils/queryParams.js')) {
        return `import {capture} from '${BRIDGE}';
          export const readQueryParam = key => key === 'preset' ? capture.requestedPreset : null;
          export const writeQueryParam = () => {};`;
      }
      if (id.endsWith('/hooks/usePresetToggleHotkeys.js')) {
        return 'export default function usePresetToggleHotkeys() {}';
      }
      if (id.endsWith('/GetWrecked/utils/theatreSheet.js')) {
        return 'export default function getTheatreSheet() { return {}; }';
      }
      return null;
    },
  };
  const server = await createServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
    plugins: [plugin],
    resolve: { alias },
    root: REPO_ROOT,
    server: { middlewareMode: true, hmr: false, ws: false },
    ssr: { noExternal: ['leva', '@mediapipe/drawing_utils', 'three-bvh-csg'] },
  });
  const report = [];
  try {
    const bridge = await server.ssrLoadModule(BRIDGE);
    const { default: resolvePresetControls } = await server.ssrLoadModule(
      '/src/utils/presetControls.js'
    );
    const files = await readdir(path.join(REPO_ROOT, 'src/components/scenes'), {
      recursive: true,
    });
    const hooks = files.filter((file) =>
      /(?:^|\/)use\w*Controls\.jsx?$/u.test(file)
    );
    for (const file of hooks.sort()) {
      const entry = `/src/components/scenes/${file}`;
      const source = await readFile(path.join(REPO_ROOT, entry), 'utf8');
      if (!source.includes('usePresetsFolder')) continue;
      const scene = file.split('/')[1];
      if (scenes && !scenes.includes(scene)) continue;
      try {
        const hook = await server.ssrLoadModule(entry);
        const probe = () => {
          hook.default([], () => {});
          return null;
        };
        bridge.reset(null);
        renderToString(React.createElement(probe));
        const initialKeys = Object.keys(bridge.capture.controls)
          .sort()
          .join('|');
        const collection = bridge.capture.preset;
        if (!collection)
          throw new Error('No preset collection was registered.');
        const collectionName = presetCollectionName(source);
        const data = await presetSource(entry, source, collectionName);
        const rows = [];
        for (const [name, saved] of Object.entries(collection.presets)) {
          bridge.reset(name);
          renderToString(React.createElement(probe));
          if (
            name === collection.defaultPreset &&
            Object.keys(bridge.capture.controls).sort().join('|') !==
              initialKeys
          ) {
            throw new Error(
              'Control keys change between identical mounts; persist stable entity IDs.'
            );
          }
          const controls = { ...bridge.capture.controls };
          delete controls.preset;
          rows.push({
            name,
            saved,
            controls,
            specs: { ...bridge.capture.specs },
            applied: resolvePresetControls({
              getPresetControls: collection.getPresetControls,
              currentControls: controls,
              presetName: name,
              presetSnapshot: structuredClone(saved),
            }),
          });
        }
        report.push({
          scene,
          entry,
          data,
          defaultPreset: collection.defaultPreset,
          rows,
        });
      } catch (error) {
        report.push({ scene, entry, error: error.message });
      }
    }
  } finally {
    await server.close();
  }
  return report;
}
