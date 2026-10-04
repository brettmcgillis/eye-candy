// Keys match the Leva schema generated from renderOptions.mjs 1:1.
import { sceneDefaults } from '@modules/pushComesToShove';

export const DEFAULT_PRESET = 'Tight Squeeze';

const BASE = {
  cameraMode: 'orbit',
  ...sceneDefaults(),
};

// Only what differs from BASE; the workbench appends generations here.
export const PRESETS = {
  'Tight Squeeze': { ...BASE },
  'Few Big Windows': {
    ...BASE,
    holeScale: 0.18,
    holeThreshold: 0.6,
    holeWarp: 2.4,
    panelBevel: 0.14,
    panelThickness: 0.5,
  },
  'Loose Weave': {
    ...BASE,
    wireCount: 340,
    wireSlack: 1.3,
    writheStrength: 5,
    cylinderResistance: 0.06,
  },
  Crowded: {
    ...BASE,
    cylinderCount: 14,
    cylinderRadiusMin: 0.3,
    cylinderRadiusMax: 0.5,
    cylinderWander: 0.45,
    cylinderWanderSpeed: 0.25,
  },
  'Painted Cables': {
    ...BASE,
    palette: 'Retrotronic (lospec)',
    paintWires: true,
  },
  'Painted Pucks': {
    ...BASE,
    palette: 'Electric Peacock',
    paintCylinders: true,
    cylinderTone: 1,
    paintPanelRim: true,
    rimTone: 0,
  },
  'Full Bleed': {
    ...BASE,
    palette: 'Cobalt Desert 7 (lospec)',
    paintPanelFace: true,
    faceTone: 0.17,
    paintPanelRim: true,
    rimTone: 0.67,
    paintCylinders: true,
    cylinderTone: 1,
    paintWires: true,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
