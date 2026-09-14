import { useEffect, useMemo, useRef } from 'react';

import {
  COLOR_KEYS,
  ENUM_KEYS,
  SCALAR_KEYS,
  createCityUniforms,
} from '../utils/materials';
import { ENUMS } from '../utils/uniformDefaults';

const KEYS = [...COLOR_KEYS, ...SCALAR_KEYS, ...ENUM_KEYS];

// Tones, rates and modes reach the materials as uniforms so a Leva edit never
// rebuilds a node graph. The joined values are the dependency because the
// controls object gets a fresh identity on every edit.
export default function useCityUniforms(config) {
  const uniforms = useMemo(createCityUniforms, []);
  const configRef = useRef(config);

  configRef.current = config;

  const signature = KEYS.map((key) => config[key]).join('|');

  useEffect(() => {
    const { current } = configRef;

    COLOR_KEYS.forEach((key) => uniforms[key].value.set(current[key]));
    SCALAR_KEYS.forEach((key) => {
      uniforms[key].value = current[key];
    });
    ENUM_KEYS.forEach((key) => {
      uniforms[key].value = Math.max(
        ENUMS[key].values.indexOf(current[key]),
        0
      );
    });
  }, [signature, uniforms]);

  return uniforms;
}
