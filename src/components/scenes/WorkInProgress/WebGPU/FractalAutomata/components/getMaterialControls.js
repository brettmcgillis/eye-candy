import { folder } from 'leva';

import {
  MATERIAL_STATES,
  MATERIAL_STATE_DEFAULTS,
} from '../utils/materialStateNode';

function stateFolder(p, state) {
  const prefix = `state${state}`;
  const defaults = MATERIAL_STATE_DEFAULTS[state];
  return folder(
    {
      [`${prefix}Roughness`]: {
        label: 'Roughness',
        value: p[`${prefix}Roughness`] ?? defaults.roughness,
        min: 0,
        max: 1,
        step: 0.01,
      },
      [`${prefix}Metalness`]: {
        label: 'Metalness',
        value: p[`${prefix}Metalness`] ?? defaults.metalness,
        min: 0,
        max: 1,
        step: 0.01,
      },
      [`${prefix}EmissiveColor`]: {
        label: 'Emissive Color',
        value: p[`${prefix}EmissiveColor`] ?? defaults.emissiveColor,
      },
      [`${prefix}EmissiveIntensity`]: {
        label: 'Emissive Intensity',
        value: p[`${prefix}EmissiveIntensity`] ?? defaults.emissiveIntensity,
        min: 0,
        max: 10,
        step: 0.05,
      },
      [`${prefix}Clearcoat`]: {
        label: 'Clearcoat',
        value: p[`${prefix}Clearcoat`] ?? defaults.clearcoat,
        min: 0,
        max: 1,
        step: 0.01,
      },
      [`${prefix}ClearcoatRoughness`]: {
        label: 'Clearcoat Roughness',
        value: p[`${prefix}ClearcoatRoughness`] ?? defaults.clearcoatRoughness,
        min: 0,
        max: 1,
        step: 0.01,
      },
      [`${prefix}Transmission`]: {
        label: 'Transmission (glass)',
        value: p[`${prefix}Transmission`] ?? defaults.transmission,
        min: 0,
        max: 1,
        step: 0.01,
      },
      [`${prefix}Ior`]: {
        label: 'IOR',
        value: p[`${prefix}Ior`] ?? defaults.ior,
        min: 1,
        max: 2.5,
        step: 0.01,
      },
      [`${prefix}Thickness`]: {
        label: 'Thickness',
        value: p[`${prefix}Thickness`] ?? defaults.thickness,
        min: 0,
        max: 5,
        step: 0.05,
      },
    },
    { collapsed: true }
  );
}

// Per-state (1/2/3) PBR material controls, keys 1:1 with presets/presets.js
// and utils/materialStateNode.js (the shared defaults source). Not a fixed
// "concrete/metal/obsidian" menu — every property is independently editable
// per state, so two states can be set to identical values (one material
// spanning multiple states) or a state can be dialed to transmission+ior+
// thickness for glass. showState1/2/3 (getPaletteControls.js) still
// separately govern per-state visibility regardless of these properties.
export default function getMaterialControls(p = {}) {
  return folder(
    MATERIAL_STATES.reduce((acc, state) => {
      acc[`State ${state}`] = stateFolder(p, state);
      return acc;
    }, {}),
    { collapsed: true }
  );
}
