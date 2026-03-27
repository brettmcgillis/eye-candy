import BURNING_AT_BOTH_ENDS_FIRE from './burningAtBothEndsFire';
import DEFAULT_FIRE_PRESET from './defaultFirePreset';
import DUMPSTER_FIRE from './dumpsterFire';
import FLYING_HIGH_FIRE from './flyingHighFire';
import POLICE_PRESENCE_FIRE from './policePresenceFire';

const FIRE_PRESETS = {
  Default: DEFAULT_FIRE_PRESET,
  'Burning At Both Ends': BURNING_AT_BOTH_ENDS_FIRE,
  'Dumpster Fire': DUMPSTER_FIRE,
  'Flying High': FLYING_HIGH_FIRE,
  'Police Presence': POLICE_PRESENCE_FIRE,
};

export default FIRE_PRESETS;
