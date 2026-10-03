import { PRESETS } from '@components/scenes/WebGPU/Subdivision/presets/presets';
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  SOURCE_IMAGE_MAX,
  buildPiece,
  renderFillSvg,
  sceneDefaults,
} from '@modules/subdivision';
import { PALETTE_NONE, getPaletteStops } from '@utils/gradientPalette';

import drawSvg from '../shared/drawSvg';
import { PALETTE_OR_NONE, fromSchema, webcamPresets } from '../shared/specs';

const KEYS = SCENE_KEYS.filter(
  (key) =>
    !RENDER_OPTIONS[key].sceneOnly &&
    RENDER_OPTIONS[key].section !== 'video' &&
    key !== 'sourceImage'
);
const OPTIONS = fromSchema(RENDER_OPTIONS, KEYS);
OPTIONS.seed = { ...OPTIONS.seed, default: 'darkroom' };

const SECTIONS = [
  ['structure', 'Structure'],
  ['field', 'Field'],
  ['palette', 'Palette & look'],
  ['output', 'Seed'],
].map(([section, title]) => ({
  keys: KEYS.filter((key) => RENDER_OPTIONS[key].section === section),
  title,
}));

export default {
  choices: { palette: PALETTE_OR_NONE },
  defaultPreset: 'Webcam Squares',
  description:
    "fractalPixelate's split loop as a tree: busy parts of the picture split finer, cells take its colour or a palette.",
  engine: 'canvas',
  id: 'subdivision',
  inputs: ['still', 'video', 'live'],
  label: 'Subdivision',
  options: OPTIONS,
  order: 10,
  presets: webcamPresets(PRESETS),
  sections: SECTIONS,

  create(stage) {
    return {
      async render({ frame, options, size }) {
        const config = { ...sceneDefaults(), ...options };
        const stops =
          config.palette === PALETTE_NONE
            ? null
            : getPaletteStops(config.palette);
        const piece = buildPiece(config, {
          canvas: size,
          image: frame.pixels(SOURCE_IMAGE_MAX),
          stops,
        });
        await drawSvg(
          renderFillSvg(piece, config, { size }),
          stage.flatContext,
          size
        );
      },
      dispose() {},
    };
  },
};
