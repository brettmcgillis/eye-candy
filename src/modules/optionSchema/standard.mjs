import { output, render, roll, still, video } from './specs.mjs';

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
  png: (extra = {}) =>
    still({
      default: false,
      help: 'Write PNG files',
      label: 'PNG',
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
  svgOcclusion: (help, extra = {}) =>
    still({
      default: true,
      help,
      label: 'SVG hidden lines',
      section: 'svg',
      type: 'boolean',
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
  views: (views, value, extra = {}) =>
    still({
      default: value,
      help: `Comma-separated views: ${views.join(', ')}`,
      label: 'Views',
      placeholder: 'LIST',
      type: 'string',
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
