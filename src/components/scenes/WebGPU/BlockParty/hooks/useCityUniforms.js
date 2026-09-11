import { useEffect, useMemo, useRef } from 'react';

import { createCityUniforms } from '../utils/materials';

const COLOR_KEYS = [
  'chevronColor',
  'darkCardColor',
  'darkEdgeColor',
  'edgeDarkColor',
  'edgeLightColor',
  'paperColor',
  'stairHighColor',
  'stairLowColor',
];

const SCALAR_KEYS = [
  'chevronSpacing',
  'chevronWidth',
  'falloffWidth',
  'glowIntensity',
  'neonIntensity',
  'pulseDepth',
  'pulseRate',
  'revealBand',
  'stairAlphaStep',
  'towerStriation',
];

// Tones and rates reach the materials as uniforms so a Leva edit never
// rebuilds a node graph or re-carves a variant. The join is the dependency:
// the controls object gets a fresh identity on every edit, so depending on it
// directly would re-run this for unrelated changes.
export default function useCityUniforms(config) {
  const uniforms = useMemo(createCityUniforms, []);
  const configRef = useRef(config);

  configRef.current = config;

  const colors = COLOR_KEYS.map((key) => config[key]).join('|');
  const scalars = SCALAR_KEYS.map((key) => config[key]).join('|');

  useEffect(() => {
    const { current } = configRef;

    COLOR_KEYS.forEach((key) => uniforms[key].value.set(current[key]));
    SCALAR_KEYS.forEach((key) => {
      uniforms[key].value = current[key];
    });
  }, [colors, scalars, uniforms]);

  return uniforms;
}
