/* eslint-disable no-console, no-await-in-loop */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const variants = [
  ['kumiko', 'WebGPU/Kumiko', 'Painted Shoji', 'front'],
  ['kumiko', 'WebGPU/Kumiko', 'Paper Resist', 'front'],
  ['kumiko', 'WebGPU/Kumiko', "Joiner's Sketchbook", 'front'],
  ['flora', 'WebGPU/Flora', 'Botanical Watercolor', 'front'],
  ['flora', 'WebGPU/Flora', 'Botanical Sketch', 'front'],
  ['trucheterie', 'WebGPU/Trucheterie', 'Ink and Wash', null],
  ['trucheterie3d', 'WebGPU/Trucheterie3D', 'Watercolor Weave', 'hero'],
  ['trucheterie3d', 'WebGPU/Trucheterie3D', 'Painted Quilt', 'hero'],
  ['iso-lines', 'WebGPU/IsoLines', 'Watercolor Atlas', null],
  ['iso-lines-relief', 'WebGPU/IsoLinesRelief', 'Watercolor Relief', 'hero'],
  ['argyle', 'WebGPU/Argyle', 'Pigment Diamonds', 'front'],
  ['rabbit', 'WebGPU/StayHunted', 'Watercolor Fable', 'painting'],
  ['paper-cuts', 'WebGL/PaperCuts', 'Painted Paper', 'front'],
  ['cumulus', null, 'Watercolor Thoughts', 'hero'],
];
const kernels = {
  trucheterie: 'trucheterieBlob',
  'iso-lines': 'isoLines',
  'iso-lines-relief': 'isoLinesRelief',
  rabbit: 'rabbit',
  'paper-cuts': 'paperCuts',
};
const loose = process.argv.includes('--loose');
const filters = process.argv.slice(2).filter((value) => value !== '--loose');
const reviewing = loose
  ? variants.map(([slug, scene, name, view]) => [
      slug,
      scene,
      `${name} · ${['Botanical Sketch', "Joiner's Sketchbook"].includes(name) ? 'Loose Pencil' : 'Loose Wash'}`,
      view,
    ])
  : variants;
let failed = false;
const selected = reviewing.filter(
  ([slug, , name]) =>
    filters.length === 0 || filters.includes(slug) || filters.includes(name)
);
for (let index = 0; index < selected.length; index += 1) {
  const [slug, scene, name, view] = selected[index];
  const presetFile = scene
    ? `/src/components/scenes/${scene}/presets/presets.js`
    : '/src/modules/cumulus/presets.js';
  const schemaFile = `/src/modules/${kernels[slug] ?? slug}/renderOptions.mjs`;
  const loaded = await loadModules([presetFile, schemaFile]);
  const presets =
    loaded[presetFile].PRESETS ?? loaded[presetFile].FOLDED_FRAME_PRESETS;
  const schema = loaded[schemaFile];
  const saved = presets[name];
  const id = name.toLowerCase().replace(/[^a-z0-9]+/gu, '-');
  const output = path.join(
    REPO_ROOT,
    'output/painted-review',
    ...(loose ? ['loose-marks'] : []),
    id
  );
  await mkdir(output, { recursive: true });
  const args = [
    path.join(REPO_ROOT, `scripts/${slug}-generate.mjs`),
    '--base',
    JSON.stringify(saved),
    '--keep',
    schema.facets().join(','),
  ];
  // Explicit pins keep capture defaults from overriding non-rollable artwork values.
  Object.entries(schema.RENDER_OPTIONS).forEach(([key, spec]) => {
    const value = saved[spec.sceneKey ?? key];
    if (!spec.scene || spec.sceneOnly || value === undefined) return;
    if (spec.type === 'boolean') args.push(value ? `--${key}` : `--no-${key}`);
    else
      args.push(
        `--${key}`,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      );
  });
  args.push(
    '--batch',
    schema.RENDER_OPTIONS.batch?.sceneKey
      ? String(saved[schema.RENDER_OPTIONS.batch.sceneKey])
      : id,
    '--out',
    output,
    '--width',
    '800',
    '--height',
    '800',
    '--pixelRatio',
    '1',
    '--count',
    '1',
    '--no-svg',
    '--no-overlay'
  );
  if (view) args.push('--views', view);
  if (slug === 'flora') args.push('--growth', '1', '--bloom', '1');
  console.log(`Capturing ${name}`);
  const child = spawn(process.execPath, args, {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (data) => {
    log += data;
  });
  child.stderr.on('data', (data) => {
    log += data;
  });
  const code = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  await writeFile(path.join(output, 'review.log'), log);
  const invalid =
    code !== 0 ||
    /GPUValidationError|Render pipeline creation failed|Shader compilation failed/u.test(
      log
    );
  console.log(
    `${name}: ${!invalid ? 'rendered' : 'failed'}\n${log.slice(-350)}`
  );
  failed ||= invalid;
}
process.exitCode = failed ? 1 : 0;
