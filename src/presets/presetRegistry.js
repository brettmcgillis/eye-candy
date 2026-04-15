/**
 * Maps each preset name to its source file path (relative to project root).
 * Used by the Vite write-preset middleware to resolve which file to update
 * when the "Save Preset" button is triggered in dev mode.
 *
 * Key rule: the path must resolve within src/presets/ — the middleware
 * validates this to prevent path traversal.
 */
export const PRESET_REGISTRY = {
  smoke: {
    Default: 'src/presets/smoke/defaultSmokePreset.js',
    'Still Pulling For You': 'src/presets/smoke/stillPullingForYouSmoke.js',
    "That's All Folks": 'src/presets/smoke/thatsAllFolksSmoke.js',
  },
  fire: {
    'Burning At Both Ends': 'src/presets/fire/burningAtBothEndsFire.js',
    'Dumpster Fire': 'src/presets/fire/dumpsterFire.js',
    'Flying High': 'src/presets/fire/flyingHighFire.js',
    'Police Presence': 'src/presets/fire/policePresenceFire.js',
  },
  cloth: {
    Default: 'src/presets/cloth/defaultCloth.js',
    Ghost: 'src/presets/cloth/ghostCloth.js',
    Ribbon: 'src/presets/cloth/ribbonCloth.js',
  },
};

/**
 * Look up the source file for a preset by tool type and preset name.
 * Returns undefined if not found.
 *
 * @param {'smoke'|'fire'} toolType
 * @param {string} presetName
 * @returns {string|undefined}
 */
export function resolvePresetFile(toolType, presetName) {
  return PRESET_REGISTRY[toolType]?.[presetName];
}
