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
  argyle: { module: 'argyle', scene: 'Argyle' },
  cumulus: { module: 'cumulus', scene: 'AllMyThoughtsAreSoCumulus' },
  apollonian: { module: 'apollonian', scene: 'Apollonian' },
  'birds-arent-real': { module: 'birdsArentReal', scene: 'BirdsArentReal' },
  'block-party': { module: 'blockParty', scene: 'BlockParty' },
  cables: { module: 'cables', scene: 'Cables' },
  candle: { module: 'candle', scene: 'BurningAtBothEnds' },
  'control-panel': { module: 'controlPanel', scene: 'ControlPanel' },
  brutalist: { module: 'brutalist', scene: 'Brutalist' },
  'dumpster-fire': { module: 'dumpsterFire', scene: 'DumpsterFire' },
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
  'paper-cuts': { module: 'paperCuts', scene: 'PaperCuts' },
  rabbit: { module: 'rabbit', scene: 'StayHunted' },
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

// The CSS size a react-icons glyph takes when the scene sets none: the
// overlay's --overlay-icon-size, which an explicit `size` is measured against.
const ICON_CSS = 17.5;

// The glyphs a scene's SceneIcon draws, in order: each react-icons
// component with the colour and relative size it is drawn at (an explicit
// `size`, else 1em scaled by an inline `fontSize`).
function glyphsOf(source) {
  const packs = new Map(
    [
      ...source.matchAll(/import \{([^}]+)\} from 'react-icons\/(\w+)'/gu),
    ].flatMap(([, names, pack]) =>
      names
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => [name, pack])
    )
  );
  const body = /function SceneIcon\(\)[\s\S]*?\n\}/u.exec(source)?.[0] ?? '';
  return [...body.matchAll(/<(\w+)\b([^>]*)\/>/gu)]
    .filter(([, component]) => packs.has(component))
    .map(([, component, props]) => {
      const size = /size=\{?"?([\d.]+)/u.exec(props)?.[1];
      const em = /fontSize: '([\d.]+)em'/u.exec(props)?.[1];
      return {
        color: /color="([^"]+)"/u.exec(props)?.[1] ?? FALLBACK_COLOR,
        component,
        pack: packs.get(component),
        scale: size ? Number(size) / ICON_CSS : Number(em ?? 1),
      };
    });
}

// Where a scene's icon comes from: an image it ships, or the react-icons
// glyphs its SceneIcon draws.
function iconOf(slug) {
  const { file, source } = readScene(slug);
  const id = /^\s+id: '([^']+)'/mu.exec(source)?.[1];
  const image = /iconFile\('([^']+)'\)/u.exec(source)?.[1];
  const glyphs = image ? [] : glyphsOf(source);
  if (!id || (!image && glyphs.length === 0)) {
    throw new Error(`${file} has no id or no recognisable icon.`);
  }
  return { glyphs, id, image };
}

// The file in public/icons a tool's overlay draws.
export function sceneIconFile(slug) {
  const { id, image } = iconOf(slug);
  return image ?? `${id}.svg`;
}

async function glyphSvg({ color, component, pack }, size) {
  const icons = await import(`react-icons/${pack}`);
  return renderToStaticMarkup(createElement(icons[component], { color, size }))
    .replace(/ style="[^"]*"/u, '')
    .replaceAll('currentColor', color);
}

// The SVG for a scene whose icon is react-icons glyphs, with every
// `currentColor` resolved to the colour the scene draws it in; null for a
// scene that ships its own image. Several glyphs sit side by side, centred
// on one line as the app's Scenemoji draws them, the tallest RASTER_SIZE.
export async function sceneIconSvg(slug) {
  const { glyphs, image } = iconOf(slug);
  if (image) return null;
  if (glyphs.length === 1) return `${await glyphSvg(glyphs[0], RASTER_SIZE)}\n`;
  const tallest = Math.max(...glyphs.map((glyph) => glyph.scale));
  let x = 0;
  const placed = await Promise.all(
    glyphs.map(async (glyph) => {
      const size = Math.round((RASTER_SIZE * glyph.scale) / tallest);
      const at = x;
      x += size;
      const y = (RASTER_SIZE - size) / 2;
      return (await glyphSvg(glyph, size)).replace(
        /^<svg /u,
        `<svg x="${at}" y="${y}" `
      );
    })
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${RASTER_SIZE}" ` +
    `viewBox="0 0 ${x} ${RASTER_SIZE}">${placed.join('')}</svg>\n`
  );
}

export const sceneIconPath = (file) => path.join(ICONS_DIR, file);
