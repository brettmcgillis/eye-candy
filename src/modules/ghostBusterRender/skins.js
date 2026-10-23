import { LOOK_KEYS } from '@modules/ghostBuster';
import GHOST_SKINS, { GHOST_SKIN_BASE } from '@presets/ghost/ghostSkins';

export const SKIN_NAMES = Object.keys(GHOST_SKINS);

// GhostBuster's Leva fallbacks for the keys only some skins carry.
const LEVA_FALLBACKS = {
  clothWidth: 1,
  clothHeight: 1,
  textureBlend: 1,
  textureProjection: 'uv',
  textureRotation: 0,
  textureScaleX: 1,
  textureScaleY: 1,
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
export function resolveSkin(source) {
  const config = typeof source === 'string' ? { skin: source } : source;
  const overrides = Object.fromEntries(
    LOOK_KEYS.filter((key) => config?.[key] != null).map((key) => [
      key,
      config[key],
    ])
  );
  const name = config?.skin;
  const skin = {
    ...LEVA_FALLBACKS,
    ...GHOST_SKIN_BASE,
    ...(GHOST_SKINS[name] ?? {}),
    ...overrides,
  };
  ['outerTextureUrl', 'innerTextureUrl'].forEach((key) => {
    if (skin[key] === 'none') skin[key] = '';
  });
  if (!skin.innerColor) skin.innerColor = skin.color;
  return skin;
}
