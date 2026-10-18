import GHOST_SKINS, { GHOST_SKIN_BASE } from '@presets/ghost/ghostSkins';

export const SKIN_NAMES = Object.keys(GHOST_SKINS);

// GhostBuster's Leva fallbacks for the keys only some skins carry.
const LEVA_FALLBACKS = {
  envRotationY: 0,
  orbitLightColor: '#ffffff',
  orbitLightEnabled: false,
  orbitLightIntensity: 20,
  orbitLightMaxY: 1,
  orbitLightMinY: -0.6,
  orbitLightRadius: 2,
  orbitLightSpeed: 0.5,
  sceneEnvIntensity: 1,
};

// A skin over GhostBuster's base the way its Leva normalises one: every key
// present, and an unset inner colour falls back to the outer one.
export function resolveSkin(name) {
  const skin = {
    ...LEVA_FALLBACKS,
    ...GHOST_SKIN_BASE,
    ...(GHOST_SKINS[name] ?? {}),
  };
  if (!skin.innerColor) skin.innerColor = skin.color;
  return skin;
}
