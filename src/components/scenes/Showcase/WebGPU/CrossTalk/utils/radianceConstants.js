import { ATLAS_SHAPES } from './occluderAtlas';

// Shared constants for the Radiance Cascades preset (a radial 1D shadow-map
// port — see radialShadowTSL.js). MAX_WINDOWS bounds both the per-window
// uniform arrays and the shadow map's row count (one row per window light).
export const MAX_WINDOWS = 8;

// Order defines each shape's id (index) — must match radialShadowTSL's
// occluderSDF branches. Used for the Leva dropdown and per-tab random pick.
const ANALYTIC_SHAPES = [
  'Circle',
  'Box',
  'Triangle',
  'Diamond',
  'Cross',
  'Ring',
  'Heart',
  'Clover',
  'Spade',
  'Club',
  'Chevron',
  'Tag',
  'Asterisk',
  'Infinity',
  'Pin',
  'Arrow',
  'Ellipse',
];

// Shape ids at or above this index are baked-SDF artwork (see occluderAtlas);
// id - ATLAS_BASE is the atlas tile.
export const ATLAS_BASE = ANALYTIC_SHAPES.length;

export const OCCLUDER_SHAPES = [...ANALYTIC_SHAPES, ...ATLAS_SHAPES];
