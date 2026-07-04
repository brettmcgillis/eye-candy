import { useMemo, useRef } from 'react';

import {
  FIELD_RESOLUTION,
  WORLD_SIZE,
  createHeightFieldStore,
  createSamplers,
  fillHeightField,
} from '../utils/heightField';
import renderTextMask from '../utils/textMask';

// Owns the baked heightfield. The DataTexture is allocated once and refilled
// in place when text/terrain controls change, so the terrain material never
// has to be rebuilt — only `version` changes, which grass uses to rescatter.
export default function useHeightField({
  edgeSoftness,
  fontFamily,
  fontWeight,
  hillAmplitude,
  hillFrequency,
  letterSpacing,
  pitDepth,
  seed,
  text,
  textRotation,
  textScale,
  waterLevel,
}) {
  const store = useMemo(() => createHeightFieldStore(), []);
  const versionRef = useRef(0);

  return useMemo(() => {
    const mask = renderTextMask({
      edgeSoftness,
      fontFamily,
      fontWeight,
      letterSpacing,
      text,
      textRotation,
      textScale,
    });
    fillHeightField(store, {
      hillAmplitude,
      hillFrequency,
      pitDepth,
      sampleMask: mask.sample,
      seed,
      waterLevel,
    });
    versionRef.current += 1;

    return {
      ...createSamplers(store),
      resolution: FIELD_RESOLUTION,
      texture: store.texture,
      version: versionRef.current,
      worldSize: WORLD_SIZE,
    };
  }, [
    edgeSoftness,
    fontFamily,
    fontWeight,
    hillAmplitude,
    hillFrequency,
    letterSpacing,
    pitDepth,
    seed,
    store,
    text,
    textRotation,
    textScale,
    waterLevel,
  ]);
}
