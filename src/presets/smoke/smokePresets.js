import DEFAULT_SMOKE_PRESET from './defaultSmokePreset';
import STILL_PULLING_FOR_YOU_SMOKE from './stillPullingForYouSmoke';
import THATS_ALL_FOLKS_SMOKE from './thatsAllFolksSmoke';

const SMOKE_PRESETS = {
  ...DEFAULT_SMOKE_PRESET,
  ...STILL_PULLING_FOR_YOU_SMOKE,
  ...THATS_ALL_FOLKS_SMOKE,
};

export default SMOKE_PRESETS;
