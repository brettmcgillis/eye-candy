import { useMemo, useRef } from 'react';

import { RENDER_OPTIONS, SCENE_KEYS } from '@modules/blockParty';
import {
  applyCityConfig,
  createCityUniforms,
  paletteStops,
} from '@modules/blockPartyRender';

const KEYS = SCENE_KEYS.filter((key) => !RENDER_OPTIONS[key].rig);

// Tones, rates and modes reach the materials as uniforms so a Leva edit never
// rebuilds a node graph. The joined values are the dependency because the
// controls object gets a fresh identity on every edit.
export default function useCityUniforms(config) {
  const uniforms = useMemo(createCityUniforms, []);
  const configRef = useRef(config);

  configRef.current = config;

  const signature = KEYS.map((key) => config[key]).join('|');

  const colors = useMemo(
    () =>
      applyCityConfig(
        uniforms,
        configRef.current,
        paletteStops(configRef.current.palette)
      ),
    [signature, uniforms]
  );

  return { colors, uniforms };
}
