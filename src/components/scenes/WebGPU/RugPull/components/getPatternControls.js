import { folder } from 'leva';

import { PATTERN_OPTIONS } from '../utils/patterns';

const DEFAULTS = {
  pattern: 'persianRug',
  patternZoom: 1,
  borderZoom: 1,
  timeScale: 1,
  seed: 0,
  tile: -1,
  paletteMix: 0,
  palette0: '#1c1633',
  palette1: '#8e1b1b',
  palette2: '#d9a441',
  palette3: '#efe3c8',
  inkSteps: 0,
  gamma: 1,
  renderScale: 1,
};

export default function getPatternControls(folderPath, defaultValues = {}) {
  const v = { ...DEFAULTS, ...defaultValues };
  const isTiled = (get) =>
    get(`${folderPath}.Pattern.pattern`) === 'funkyMotherboardCarpet';

  return {
    Pattern: folder(
      {
        pattern: {
          value: v.pattern,
          label: 'Pattern',
          options: PATTERN_OPTIONS,
        },
        patternZoom: {
          value: v.patternZoom,
          label: 'Zoom',
          min: 0.05,
          max: 20,
          step: 0.01,
        },
        borderZoom: {
          value: v.borderZoom,
          label: 'Border Zoom',
          min: 0.05,
          max: 20,
          step: 0.01,
        },
        timeScale: {
          value: v.timeScale,
          label: 'Time Scale',
          min: 0,
          max: 8,
          step: 0.01,
        },
        tile: {
          value: v.tile,
          label: 'Tile (-1 = Mosaic)',
          min: -1,
          max: 15,
          step: 1,
          render: isTiled,
        },
        seed: { value: v.seed, label: 'Seed', min: 0, max: 1000, step: 0.01 },
      },
      { collapsed: true }
    ),
    Palette: folder(
      {
        paletteMix: {
          value: v.paletteMix,
          label: 'Palette Mix',
          min: 0,
          max: 1,
          step: 0.01,
        },
        palette0: { value: v.palette0, label: 'Ground' },
        palette1: { value: v.palette1, label: 'Red Channel' },
        palette2: { value: v.palette2, label: 'Green Channel' },
        palette3: { value: v.palette3, label: 'Blue Channel' },
        inkSteps: {
          value: v.inkSteps,
          label: 'Ink Steps',
          min: 0,
          max: 8,
          step: 1,
        },
        gamma: { value: v.gamma, label: 'Gamma', min: 0.2, max: 3, step: 0.01 },
        renderScale: {
          value: v.renderScale,
          label: 'Render Scale',
          min: 0.25,
          max: 1,
          step: 0.05,
        },
      },
      { collapsed: true }
    ),
  };
}
