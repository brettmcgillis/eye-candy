import { useMemo } from 'react';

import { hashPaintSeed } from '@modules/painted';

import createPaintMaterial from './material';

export default function usePaintMaterialTransform(
  config,
  pigment = null,
  shading = 'surface',
  namespace = 'halo'
) {
  const {
    paintStyle,
    paintOpacity,
    paintScale,
    paintGrain,
    paintInk,
    paintPaper,
    paintBleed,
    paintPooling,
    paintHatchRoughness,
    paintStrokeRoughness,
    paintFollowPalette,
    paletteName,
    paletteExact,
    ringsPalette,
    ringsPaletteExact,
  } = config;
  const haloSeed = config.haloSeed ?? '';
  return useMemo(() => {
    if (!paintStyle || paintStyle === 'original') return null;
    return (material, identity) =>
      createPaintMaterial(
        material,
        {
          haloSeed,
          paintStyle,
          paintOpacity,
          paintScale,
          paintGrain,
          paintInk,
          paintPaper,
          paintBleed,
          paintPooling,
          paintHatchRoughness,
          paintStrokeRoughness,
          paintFollowPalette,
          paletteName,
          paletteExact,
          ringsPalette,
          ringsPaletteExact,
        },
        {
          color: pigment,
          uvMapping: !pigment,
          shading,
          paletteRole: true,
          seed:
            hashPaintSeed(`${namespace}:${identity ?? material.name}`) %
            0x1000000,
        }
      );
  }, [
    paintStyle,
    paintOpacity,
    paintScale,
    paintGrain,
    paintInk,
    paintPaper,
    paintBleed,
    paintPooling,
    paintHatchRoughness,
    paintStrokeRoughness,
    paintFollowPalette,
    paletteName,
    paletteExact,
    ringsPalette,
    ringsPaletteExact,
    pigment,
    shading,
    haloSeed,
    namespace,
  ]);
}
