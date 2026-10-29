// Keys match the Leva schema generated from @modules/candle's
// renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/candle';

export const DEFAULT_PRESET = 'Enlightened';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
  autoRotate: true,
};

export const PRESETS = {
  Enlightened: BASE,
  Extinguished: {
    ...BASE,
    emberState: 'snuffed',
    flame: 'out',
  },
  Smouldering: {
    ...BASE,
    emberState: 'smoulder',
    flame: 'out',
    smokeOpacity: 0.06,
  },
  Guttering: {
    ...BASE,
    burnDepth: 0.8,
    dripCount: 7,
    dripLength: 1.6,
    flameState: 'gutter',
  },
  Draught: {
    ...BASE,
    flameState: 'breeze',
    flameWindAzimuth: -60,
  },
  Sooty: {
    ...BASE,
    flameState: 'sooty',
    smokeColor: '#9a9a9a',
  },
  'Twisted Taper': {
    ...BASE,
    profile: 'twisted',
    profileAmount: 0.8,
    profileCount: 5,
    profileTwist: 1.8,
    radius: 0.32,
    waxColor: '#9e1b1b',
  },
  Cartoon: {
    ...BASE,
    flameState: 'flicker',
    look: 'cartoon',
    styleBackground: '#1b1f3b',
    styleWax: '#ff6b6b',
  },
  'Cartoon Gutter': {
    ...BASE,
    dripCount: 7,
    flameState: 'gutter',
    look: 'cartoon',
    profile: 'twisted',
    styleBackground: '#2d1e2f',
    styleWax: '#8ce99a',
  },
  Claymation: {
    ...BASE,
    look: 'clay',
    styleBackground: '#3b2f2f',
    styleWax: '#e63946',
  },
  'Clay Snuffed': {
    ...BASE,
    emberState: 'snuffed',
    flame: 'out',
    look: 'clay',
    styleBackground: '#33402a',
    styleWax: '#457b9d',
  },
  'Shader Flame': {
    ...BASE,
    flame: 'shader',
    smoke: 'billboard',
  },
  'Volumetric Slices': {
    ...BASE,
    flame: 'slices',
    smoke: 'ribbon',
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
