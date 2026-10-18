/* eslint-disable import/no-extraneous-dependencies */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './loadModules.mjs';

// The icon a render burns into its overlay is the one the scene shows in the
// app's Scenemoji. A scene's icon is a react-icons component, so the file in
// public/icons is generated from the scene's own scene.config.jsx
// (scripts/scene-icons.mjs) rather than drawn by hand, and a scene that
// already ships an image (Rorschach) names that file instead.

// Every generator that burns the overlay in: its script slug, its scene
// folder, and the module whose renderOptions.mjs declares the overlay options.
export const OVERLAY_TOOLS = {
  apollian: { module: 'apollian', scene: 'Apollian' },
  'block-party': { module: 'blockParty', scene: 'BlockParty' },
  brutalist: { module: 'brutalist', scene: 'Brutalist' },
  'exhibit-a': { module: 'exhibitA', scene: 'ExhibitA' },
  flora: { module: 'flora', scene: 'Flora' },
  'fractal-automata': { module: 'fractalAutomata', scene: 'FractalAutomata' },
  fungi: { module: 'fungi', scene: 'Fungi' },
  'ghost-buster': { module: 'ghostBuster', scene: 'GhostBuster' },
  'hyper-cubes': { module: 'hyperCubes', scene: 'HyperCubes' },
  imperfection: { module: 'imperfection', scene: 'Imperfection' },
  'iso-lines': { module: 'isoLines', scene: 'IsoLines' },
  'iso-lines-relief': { module: 'isoLinesRelief', scene: 'IsoLinesRelief' },
  'iso-meter': { module: 'isoMeter', scene: 'IsoMeter' },
  kumiko: { module: 'kumiko', scene: 'Kumiko' },
  'nesting-boxes': { module: 'nestingBoxes', scene: 'NestingBoxes' },
  'network-test': { module: 'networkTest', scene: 'NetworkTest' },
  'push-comes-to-shove': {
    module: 'pushComesToShove',
    scene: 'PushComesToShove',
  },
  rorschach: { module: 'rorschach', scene: 'Rorschach' },
  'rug-pull': { module: 'rugPull', scene: 'RugPull' },
  subdivision: { module: 'subdivision', scene: 'Subdivision' },
  'subdivision-relief': {
    module: 'subdivisionRelief',
    scene: 'SubdivisionRelief',
  },
  trucheterie: { module: 'trucheterieBlob', scene: 'Trucheterie' },
  trucheterie3d: { module: 'trucheterie3d', scene: 'Trucheterie3D' },
};

// Rasterised at this size, then drawn at 26 CSS px times the overlay's zoom:
// large enough for a 4x retina export, and the same for every glyph whatever
// viewBox its icon set draws on.
const RASTER_SIZE = 256;
const FALLBACK_COLOR = '#141414';
const ICONS_DIR = path.join(REPO_ROOT, 'public', 'icons');
const SCENES_DIR = path.join(REPO_ROOT, 'src', 'components', 'scenes');

function sceneConfigPath(scene) {
  const channel = readdirSync(SCENES_DIR).find((name) => {
    try {
      return readdirSync(path.join(SCENES_DIR, name)).includes(scene);
    } catch {
      return false;
    }
  });
  if (!channel) throw new Error(`no scene folder named ${scene}.`);
  return path.join(SCENES_DIR, channel, scene, 'scene.config.jsx');
}

function readScene(slug) {
  const tool = OVERLAY_TOOLS[slug];
  if (!tool) throw new Error(`"${slug}" is not in OVERLAY_TOOLS.`);
  const file = sceneConfigPath(tool.scene);
  return { file, source: readFileSync(file, 'utf8') };
}

// Where a scene's icon comes from: an image it ships, or a react-icons
// component with the props the scene draws it at.
function iconOf(slug) {
  const { file, source } = readScene(slug);
  const id = /^\s+id: '([^']+)'/mu.exec(source)?.[1];
  const image = /iconFile\('([^']+)'\)/u.exec(source)?.[1];
  const imported = /import \{ (\w+) \} from 'react-icons\/(\w+)'/u.exec(source);
  const props = imported
    ? new RegExp(`<${imported[1]}\\b([^>]*)/>`, 'u').exec(source)?.[1]
    : null;
  if (!id || (!image && !imported)) {
    throw new Error(`${file} has no id or no recognisable icon.`);
  }
  return {
    color: /color="([^"]+)"/u.exec(props ?? '')?.[1] ?? FALLBACK_COLOR,
    component: imported?.[1],
    id,
    image,
    pack: imported?.[2],
  };
}

// The file in public/icons a tool's overlay draws.
export function sceneIconFile(slug) {
  const { id, image } = iconOf(slug);
  return image ?? `${id}.svg`;
}

// The SVG for a scene whose icon is a react-icons component, with every
// `currentColor` resolved to the colour the scene draws it in; null for a
// scene that ships its own image.
export async function sceneIconSvg(slug) {
  const { color, component, image, pack } = iconOf(slug);
  if (image) return null;
  const icons = await import(`react-icons/${pack}`);
  const markup = renderToStaticMarkup(
    createElement(icons[component], { color, size: RASTER_SIZE })
  );
  return `${markup
    .replace(/ style="[^"]*"/u, '')
    .replaceAll('currentColor', color)}\n`;
}

export const sceneIconPath = (file) => path.join(ICONS_DIR, file);
