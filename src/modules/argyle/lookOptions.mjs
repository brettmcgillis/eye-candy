import { choice, color, inFacet, num, rolled } from '../optionSchema/index.mjs';
import { MOTIONS } from './choices.mjs';

const n = (facet, section, label, value, min, max, step, window = [min, max]) =>
  rolled(facet, window, num(section, null, label, value, min, max, step));
const c = (facet, section, label, choices, value) =>
  inFacet(facet, choice(section, null, label, choices, value));
export default {
  pattern: c(
    'layout',
    'layout',
    'Composition',
    ['column', 'logo', 'lattice'],
    'column'
  ),
  lowerStyle: c(
    'layout',
    'layout',
    'Lower layer',
    ['filled', 'hollow'],
    'filled'
  ),
  upperStyle: c(
    'layout',
    'layout',
    'Upper layer',
    ['filled', 'hollow'],
    'filled'
  ),
  frameWidth: n(
    'layout',
    'layout',
    'Frame width',
    0.12,
    0.03,
    0.3,
    0.005,
    [0.07, 0.2]
  ),
  dimension: c(
    'relief',
    'relief',
    'Dimension',
    ['flat', 'relief', 'extruded'],
    'flat'
  ),
  seed: n('field', 'field', 'Field seed', 42, 0, 999999, 1),
  columns: n('layout', 'layout', 'Columns', 9, 2, 64, 1, [3, 13]),
  rows: n('layout', 'layout', 'Rows', 21, 2, 64, 1, [9, 39]),
  rotation: n('layout', 'layout', 'Tile rotation', 45, 0, 180, 1, [35, 55]),
  tileSize: n(
    'layout',
    'layout',
    'Square size',
    1,
    0.3,
    1.25,
    0.01,
    [0.8, 1.08]
  ),
  topScale: n(
    'layout',
    'layout',
    'Upper layer scale',
    1,
    0.3,
    1.3,
    0.01,
    [0.75, 1.15]
  ),
  coverage: n('field', 'field', 'Coverage', 0.68, 0, 1, 0.01, [0.35, 1]),
  softness: n(
    'field',
    'field',
    'Fade width',
    0.23,
    0.005,
    0.6,
    0.005,
    [0.1, 0.4]
  ),
  frequency: n(
    'field',
    'field',
    'Perlin scale',
    0.13,
    0.015,
    1,
    0.005,
    [0.06, 0.3]
  ),
  octaves: n('field', 'field', 'Octaves', 3, 1, 4, 1, [2, 4]),
  warp: n('field', 'field', 'Domain warp', 0.7, 0, 2, 0.01, [0, 1.4]),
  layerCorrelation: n(
    'field',
    'field',
    'Layer correlation',
    0.8,
    0,
    1,
    0.01,
    [0.4, 1]
  ),
  edgeFade: n('field', 'field', 'Edge falloff', 0, 0, 1, 0.01, [0, 0.45]),
  fadeStyle: c(
    'field',
    'field',
    'Fade treatment',
    ['opacity', 'shrink', 'both'],
    'both'
  ),
  palette: c(
    'color',
    'color',
    'Palette',
    [
      'signal',
      'bauhaus',
      'lagoon',
      'orchid',
      'citrus',
      'mineral',
      'nocturne',
      'sorbet',
      'ember',
      'custom',
    ],
    'signal'
  ),
  background: inFacet('color', color('color', null, 'Paper', '#f3eadb')),
  inkA: inFacet('color', color('color', null, 'Custom lower ink', '#c53544')),
  inkB: inFacet('color', color('color', null, 'Custom upper ink', '#171b27')),
  inkC: inFacet('color', color('color', null, 'Custom accent', '#e8a94a')),
  colorMode: c(
    'color',
    'color',
    'Colour placement',
    ['layers', 'bands', 'radial', 'noise', 'checker'],
    'layers'
  ),
  colorScale: n(
    'color',
    'color',
    'Colour scale',
    0.12,
    0.01,
    0.6,
    0.005,
    [0.04, 0.3]
  ),
  colorShift: n('color', 'color', 'Palette offset', 0, 0, 1, 0.01),
  layerContrast: n(
    'color',
    'color',
    'Layer contrast',
    0.75,
    0,
    1,
    0.01,
    [0.35, 1]
  ),
  motion: c('motion', 'motion', 'Choreography', MOTIONS, 'tide'),
  loopSeconds: n('motion', 'motion', 'Loop seconds', 8, 2, 30, 0.5, [5, 16]),
  phase: n('motion', 'motion', 'Starting phase', 0.13, 0, 1, 0.01),
  travel: n('motion', 'motion', 'Noise travel', 0.8, 0, 3, 0.01, [0.2, 1.8]),
  amplitude: n(
    'motion',
    'motion',
    'Motion amount',
    0.45,
    0,
    1,
    0.01,
    [0.15, 0.8]
  ),
  wavelength: n('motion', 'motion', 'Wavelength', 9, 2, 30, 0.1, [5, 18]),
  direction: n('motion', 'motion', 'Direction', 25, 0, 360, 1),
  colorMotion: n(
    'motion',
    'motion',
    'Colour movement',
    0.2,
    0,
    1,
    0.01,
    [0, 0.4]
  ),
  depth: n('relief', 'relief', 'Extrusion', 0.18, 0.02, 2.5, 0.01, [0.1, 1.8]),
  lift: n('relief', 'relief', 'Lift', 0.7, 0, 3, 0.01, [0.2, 1.5]),
  tilt: n('relief', 'relief', 'Tilt', 0.3, 0, 1.1, 0.01, [0, 0.55]),
  layerGap: n(
    'relief',
    'relief',
    'Layer gap',
    0.22,
    0.02,
    2,
    0.01,
    [0.1, 0.65]
  ),
  roughness: n(
    'relief',
    'relief',
    'Roughness',
    0.65,
    0.15,
    1,
    0.01,
    [0.4, 0.9]
  ),
};
