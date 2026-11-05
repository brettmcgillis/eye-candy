export const DEFAULT_PRESET = 'ScribbleTogether';

// Literal artwork values; new controls require an explicit migration.
const SAVED_BASE = {
  backgroundColor: '#2b2d42',
  paperColor: '#fbf8f1',
  pencilScale: 0.8,
  collabPromptSeconds: 45,
  collabResolution: 1536,
  competeRoundSeconds: 20,
  competeGridSize: 384,
  competeBrushRadius: 1.6,
  competeEraserEvery: 8,
  competeEraserSize: 0.07,
  competeEraserSeconds: 2.2,
};

export const PRESETS = {
  ScribbleTogether: { ...SAVED_BASE },
  ScribbleBattle: {
    ...SAVED_BASE,
    backgroundColor: '#1d3557',
    pencilScale: 1.3,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
