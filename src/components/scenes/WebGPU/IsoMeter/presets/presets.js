// Keys match the Leva schema generated from @modules/isoMeter's
// renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/isoMeter';

export const DEFAULT_PRESET = 'Ambifeuille';

const BASE = sceneDefaults();

export const PRESETS = {
  Ambifeuille: BASE,
  'Ambifeuille Inclusions': {
    ...BASE,
    seed: `0x${'4'.repeat(64)}`,
    tokenId: 4,
  },
  'Ambifeuille Inverted': { ...BASE, perspective: 'inverted', tokenId: 3 },
  'Ambifeuille Cutaway': { ...BASE, cutI: true, cutK: true, tokenId: 9 },
  Dixfeuille: {
    ...BASE,
    piece: 'dixfeuille',
    seed: `0x${'2'.repeat(64)}`,
    tokenId: 12,
  },
  'Dixfeuille Deep Warp': {
    ...BASE,
    piece: 'dixfeuille',
    seed: `0x${'3'.repeat(64)}`,
    tokenId: 15,
  },
  'Winterkammer #17': {
    ...BASE,
    piece: 'winterkammer',
    seed: '0xb5eaf49fa8ff11cc6cdd43f5675d5278e204c539255c2c062b27c11af21d08d5',
  },
  Winterkammer: { ...BASE, piece: 'winterkammer', seed: 'winterkammer' },
  'Pacific Layers': {
    ...BASE,
    palette: 'Pacific Dream',
    paletteBackground: true,
    paletteMode: 'layers',
    tokenId: 11,
  },
  'Moor Strata': {
    ...BASE,
    palette: 'Moor',
    paletteMode: 'strata',
    piece: 'dixfeuille',
    seed: `0x${'2'.repeat(64)}`,
    tokenId: 12,
  },
  'Maldives Winterkammer': {
    ...BASE,
    palette: 'Maldives',
    paletteBackground: true,
    paletteInk: true,
    piece: 'winterkammer',
    seed: 'winterkammer',
  },
  'Ambifeuille Voxel': { ...BASE, view: 'voxel' },
  'Ambifeuille Inclusions Voxel': {
    ...BASE,
    seed: `0x${'4'.repeat(64)}`,
    tokenId: 4,
    view: 'voxel',
  },
  'Ambifeuille Cutaway Voxel': {
    ...BASE,
    cutI: true,
    cutK: true,
    tokenId: 9,
    view: 'voxel',
  },
  'Dixfeuille Voxel': {
    ...BASE,
    piece: 'dixfeuille',
    seed: `0x${'2'.repeat(64)}`,
    tokenId: 12,
    view: 'voxel',
  },
  'Dixfeuille Deep Warp Voxel': {
    ...BASE,
    piece: 'dixfeuille',
    seed: `0x${'3'.repeat(64)}`,
    tokenId: 15,
    view: 'voxel',
  },
  'Winterkammer #17 Voxel': {
    ...BASE,
    piece: 'winterkammer',
    seed: '0xb5eaf49fa8ff11cc6cdd43f5675d5278e204c539255c2c062b27c11af21d08d5',
    view: 'voxel',
  },
  'Winterkammer Voxel Flat Stack': {
    ...BASE,
    piece: 'winterkammer',
    seed: 'winterkammer',
    stackDepth: 0,
    view: 'voxel',
  },
  'Explorer Voxel': {
    ...BASE,
    exploreAxis: 'k',
    holdSeconds: 3,
    levelsPerSecond: 120,
    motion: 'explore',
    view: 'voxel',
  },
  Explorer: {
    ...BASE,
    exploreAxis: 'k',
    holdSeconds: 3,
    levelsPerSecond: 120,
    motion: 'explore',
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
