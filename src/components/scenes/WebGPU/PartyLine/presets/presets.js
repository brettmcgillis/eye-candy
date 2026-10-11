export const DEFAULT_PRESET = 'ScribbleTogether';

export const PRESETS = {
  ScribbleTogether: {
    backgroundColor: '#2b2d42',
    paperColor: '#fbf8f1',
    pencilScale: 0.8,
    collabPromptSeconds: 45,
    collabResolution: 1536,
  },
  ScribbleBattle: {
    backgroundColor: '#1d3557',
    paperColor: '#fbf8f1',
    pencilScale: 1.3,
    competeRoundSeconds: 20,
    competeGridSize: 384,
    competeBrushRadius: 1.6,
    competeEraserEvery: 8,
    competeEraserSize: 0.07,
    competeEraserSeconds: 2.2,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
