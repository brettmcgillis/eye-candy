import { output, render, roll, still, video } from './specs.mjs';

// plotKit's shadePath styles, for a plot shaded from its render.
export const SVG_SHADINGS = [
  'none',
  'crosshatch',
  'halftone',
  'stipple',
  'squiggle',
  'scribble',
  'tsp',
];
const SHADED = SVG_SHADINGS.filter((style) => style !== 'none');
const ANGLED = ['crosshatch', 'halftone', 'squiggle', 'scribble'];

// The app's overlay chrome comes in the safe-area insets Instagram's UI
// leaves clear.
export const IG_PRESETS = ['story', 'reel', 'post'];

const overlayChrome = (item) => ({
  scope: 'shared',
  section: 'overlay',
  ...item,
});

// The render settings every generator CLI shares, in their usual form. Each
// takes the per-generator wording it needs plus an `extra` override.
const standard = {
  base: (noun, extra = {}) =>
    roll({
      cliOnly: true,
      default: null,
      help: `A ${noun ? `${noun} ` : ''}config (or props.json path) the roll starts from`,
      nullable: true,
      placeholder: 'JSON',
      type: 'json',
      ...extra,
    }),
  batch: (extra = {}) =>
    output({
      default: null,
      help: 'Batch seed: names the generations (batch, batch-1…) and seeds the facet rolls. Omit for a random one',
      label: 'Batch seed',
      nullable: true,
      placeholder: 'WORD',
      text: true,
      type: 'seed',
      ...extra,
    }),
  // A Live-tab capture to finish (runStills reads it; the dev server's
  // /captures route sets it).
  capture: (extra = {}) =>
    output({
      cliOnly: true,
      default: null,
      help: 'A Live-tab capture folder to finish (formats, overlay, sidecar) instead of rendering',
      nullable: true,
      placeholder: 'PATH',
      scope: 'still',
      type: 'string',
      ...extra,
    }),
  count: (nouns, extra = {}) =>
    output({
      default: 1,
      help: `How many ${nouns} to roll`,
      label: 'Count',
      max: 200,
      min: 1,
      placeholder: 'N',
      step: 1,
      type: 'number',
      ...extra,
    }),
  fov: (value, extra = {}) =>
    render({
      default: value,
      help: 'Vertical field of view in degrees (perspective only)',
      label: 'Field of view',
      max: 90,
      min: 10,
      step: 1,
      type: 'number',
      ...extra,
    }),
  fps: (extra = {}) =>
    video({
      choices: [24, 30, 60],
      default: 30,
      help: 'Frames per second',
      label: 'FPS',
      max: 60,
      min: 24,
      type: 'number',
      ...extra,
    }),
  height: (value = 1350, extra = {}) =>
    output({
      default: value,
      help: 'Height',
      label: 'Height',
      max: 8192,
      min: 64,
      placeholder: 'PX',
      step: 2,
      type: 'number',
      ...extra,
    }),
  hold: (value, help, extra = {}) =>
    video({
      default: value,
      help,
      label: 'Hold',
      max: 300,
      min: 0,
      placeholder: 'S',
      step: 0.5,
      type: 'number',
      ...extra,
    }),
  ig: (extra = {}) =>
    overlayChrome({
      choices: [...IG_PRESETS, 'none'],
      default: 'post',
      help: 'Safe-area insets; only applies with --overlay',
      label: 'Safe area',
      type: 'enum',
      ...extra,
    }),
  keep: (facets, extra = {}) =>
    roll({
      default: '',
      help: `Comma-separated facets to hold while the rest roll: ${facets.join(', ')}`,
      label: 'Hold facets',
      placeholder: 'LIST',
      type: 'string',
      ...extra,
    }),
  margin: (value, help, extra = {}) =>
    render({
      default: value,
      help,
      label: 'Fit margin',
      max: 0.5,
      min: 0,
      step: 0.01,
      type: 'number',
      ...extra,
    }),
  mode: (modes, value, help, extra = {}) =>
    video({
      choiceAliases: modes.includes('montage')
        ? { stills: 'montage' }
        : undefined,
      choices: modes,
      default: value,
      help,
      label: 'Mode',
      type: 'enum',
      ...extra,
    }),
  orbit: (value, help, extra = {}) =>
    video({
      default: value,
      help,
      label: 'Orbit drift',
      max: 360,
      min: -360,
      placeholder: 'DEG',
      step: 5,
      type: 'number',
      ...extra,
    }),
  out: (name, extra = {}) =>
    output({
      cliOnly: true,
      default: `output/${name}`,
      help: 'Output directory (stills) or file (video)',
      placeholder: 'PATH',
      type: 'string',
      ...extra,
    }),
  overlay: (extra = {}) =>
    overlayChrome({
      default: false,
      help: 'Burn the scene overlay (Reversal mark, scene icon, version, name and date) into the output',
      label: 'Overlay',
      type: 'boolean',
      ...extra,
    }),
  // The three options that burn the overlay in, as one spread. `extra` is
  // for `overlay` alone: a scene that has its own overlay toggle says so there.
  overlayOptions: (extra = {}) => ({
    ig: standard.ig(),
    overlay: standard.overlay(extra),
    viewport: standard.viewport(),
  }),
  palettes: (facet, extra = {}) =>
    roll({
      array: true,
      cliOnly: true,
      default: null,
      help: `Palette names the ${facet} roll picks from (the CLI fills this from gradients.json)`,
      nullable: true,
      placeholder: 'JSON',
      type: 'json',
      ...extra,
    }),
  pixelRatio: (extra = {}) =>
    output({
      choices: [1, 2, 3, 4],
      default: 2,
      help: 'Renders at width×ratio by height×ratio',
      label: 'Pixel ratio',
      max: 4,
      min: 1,
      type: 'number',
      ...extra,
    }),
  plotWidthMm: (value = 200, extra = {}) =>
    still({
      default: value,
      help: 'Physical plot width in mm for the SVG; the height follows the canvas',
      label: 'Plot width (mm)',
      max: 2000,
      min: 10,
      placeholder: 'MM',
      section: 'svg',
      step: 1,
      type: 'number',
      ...extra,
    }),
  mp4: (extra = {}) =>
    video({
      default: true,
      help: 'Write an MP4 (H.264)',
      label: 'MP4',
      section: 'output',
      type: 'boolean',
      ...extra,
    }),
  projection: (choices, value, extra = {}) =>
    render({
      choices,
      default: value,
      help: 'Camera projection',
      label: 'Projection',
      type: 'enum',
      ...extra,
    }),
  rollSeed: (facet, follows, extra = {}) =>
    roll({
      default: null,
      help: `Seed for the ${facet} roll; blank follows the ${follows}`,
      label: `${facet[0].toUpperCase()}${facet.slice(1)} seed`,
      nullable: true,
      placeholder: 'WORD',
      text: true,
      type: 'seed',
      ...extra,
    }),
  samples: (extra = {}) =>
    render({
      choices: [0, 4],
      default: 4,
      help: 'MSAA samples',
      label: 'MSAA',
      max: 4,
      min: 0,
      type: 'number',
      ...extra,
    }),
  shadows: (extra = {}) =>
    render({
      default: true,
      help: 'Key light shadow map',
      label: 'Shadows',
      type: 'boolean',
      ...extra,
    }),
  svg: (help, extra = {}) =>
    still({ default: false, help, label: 'SVG', type: 'boolean', ...extra }),
  // 0 keeps the plot as the bench draws it; 1–8 regroup it into that many
  // inks (plotKit inkLayers, run on every SVG a still writes).
  svgColors: (extra = {}) =>
    still({
      default: 0,
      group: 'colour',
      help: 'Plot in this many inks picked from the plot’s own colours, a layer per ink for the Plotterizer to match to pens (0: as drawn)',
      label: 'SVG colours',
      max: 8,
      min: 0,
      placeholder: 'N',
      section: 'svg',
      step: 1,
      type: 'number',
      ...extra,
    }),
  svgShadeAngle: (extra = {}) =>
    still({
      default: 45,
      help: 'Degrees the hatching and the halftone grid run at',
      label: 'SVG shade angle',
      max: 90,
      min: -90,
      section: 'svg',
      step: 1,
      type: 'number',
      when: { svgShading: ANGLED },
      ...extra,
    }),
  svgShadeGamma: (extra = {}) =>
    still({
      default: 1,
      help: 'Above 1 keeps shading to the darkest areas; below 1 spreads it into the lights',
      label: 'SVG shade gamma',
      max: 3,
      min: 0.3,
      section: 'svg',
      step: 0.05,
      type: 'number',
      when: { svgShading: SHADED },
      ...extra,
    }),
  svgShadeSpacing: (value = 6, extra = {}) =>
    still({
      default: value,
      help: 'Shading line, cell or stipple spacing in output px',
      label: 'SVG shade spacing',
      max: 40,
      min: 1.5,
      placeholder: 'PX',
      section: 'svg',
      step: 0.5,
      type: 'number',
      when: { svgShading: SHADED },
      ...extra,
    }),
  svgShading: (help, value = 'none', extra = {}) =>
    still({
      choices: SVG_SHADINGS,
      default: value,
      help,
      label: 'SVG shading',
      section: 'svg',
      type: 'enum',
      ...extra,
    }),
  svgOcclusion: (help, extra = {}) =>
    still({
      default: true,
      help,
      label: 'SVG hidden lines',
      section: 'svg',
      type: 'boolean',
      ...extra,
    }),
  svgPenMm: (extra = {}) =>
    still({
      default: 0.3,
      help: 'Physical pen width in mm: halftone and stipple dots are filled with rings this far apart, and dots narrower than it are dropped',
      label: 'SVG pen width (mm)',
      max: 3,
      min: 0.05,
      placeholder: 'MM',
      section: 'svg',
      step: 0.05,
      type: 'number',
      ...extra,
    }),
  svgStroke: (extra = {}) =>
    still({
      default: 0.6,
      help: 'Stroke width in output px; 0 draws hairlines',
      label: 'SVG stroke',
      max: 8,
      min: 0,
      placeholder: 'PX',
      section: 'svg',
      step: 0.1,
      type: 'number',
      ...extra,
    }),
  turns: (noun, extra = {}) =>
    video({
      default: 1,
      help: `Turntable revolutions per ${noun}`,
      label: 'Turns',
      max: 10,
      min: 0.25,
      placeholder: 'N',
      step: 0.25,
      type: 'number',
      ...extra,
    }),
  view: (views, value, extra = {}) =>
    video({
      choices: views,
      default: value,
      help: 'Camera view for the clip',
      label: 'View',
      type: 'enum',
      ...extra,
    }),
  viewport: (extra = {}) =>
    overlayChrome({
      default: 390,
      help: 'CSS pixel width the overlay emulates; output width over this is the device pixel ratio it draws at. 390 matches an iPhone',
      label: 'Viewport',
      max: 8192,
      min: 64,
      nullable: true,
      placeholder: 'N',
      step: 1,
      type: 'number',
      ...extra,
    }),
  views: (views, value, extra = {}) =>
    still({
      default: value,
      help: `Comma-separated views: ${views.join(', ')}`,
      label: 'Views',
      placeholder: 'LIST',
      type: 'string',
      ...extra,
    }),
  transparent: (extra = {}) =>
    output({
      aliases: ['transparentBackground'],
      default: false,
      help: 'Leave the background transparent: alpha in WebP and WebM; MP4 fills it with the background colour',
      label: 'Transparent',
      type: 'boolean',
      ...extra,
    }),
  // The video formats every video CLI writes, ticked like the image ones.
  videoFormats: () => ({ mp4: standard.mp4(), webm: standard.webm() }),
  webm: (extra = {}) =>
    video({
      default: false,
      help: 'Write a WebM (VP9; keeps alpha with --transparent)',
      label: 'WebM',
      section: 'output',
      type: 'boolean',
      ...extra,
    }),
  webp: (extra = {}) =>
    still({
      default: true,
      help: 'Write lossless WebP files',
      label: 'WebP',
      type: 'boolean',
      ...extra,
    }),
  width: (value = 1080, extra = {}) =>
    output({
      default: value,
      help: 'Width',
      label: 'Width',
      max: 8192,
      min: 64,
      placeholder: 'PX',
      step: 2,
      type: 'number',
      ...extra,
    }),
};

export default standard;
