import { useControls } from 'leva';
import * as THREE from 'three';

import React from 'react';

import { useLoader } from '@react-three/fiber';

import { imageFile, modelFile } from '../../../../../utils/appUtils';
import TexturedSplat from './TexturedSplat';

const CUSTOM_SPLAT_TEXTURE_OPTIONS = {
  none: 'none',
  heart: 'heart-bw.png',
  circle: 'circle.png',
  square: 'square.png',
  bret: 'bret-inner.png',
  reversal: 'reversal-inner.png',
  'reversal reversed': 'reversal-outer-empty.png',
};

const CUSTOM_SPLAT_TEXTURE_FILES = Object.values(CUSTOM_SPLAT_TEXTURE_OPTIONS)
  .filter((value) => value !== 'none')
  .map((fileName) => imageFile(fileName));

const DEFAULT_CUSTOM_SPLAT_CONFIG = {
  sizeMultiplier: 0.75,
  alphaMultiplier: 1.0,
  maskCutoff: 0.05,
  maskGamma: 1.0,
};

export default function CustomMultiSplat({ splats, splatClickHandlers }) {
  const customControls = useControls(
    'Custom Splat',
    {
      texture: {
        value: 'heart-bw.png',
        options: CUSTOM_SPLAT_TEXTURE_OPTIONS,
        label: 'Texture',
        order: -100,
      },
      sizeMultiplier: {
        value: DEFAULT_CUSTOM_SPLAT_CONFIG.sizeMultiplier,
        min: 0.25,
        max: 2.0,
        step: 0.01,
        label: 'Size',
      },
      alphaMultiplier: {
        value: DEFAULT_CUSTOM_SPLAT_CONFIG.alphaMultiplier,
        min: 0.1,
        max: 2.0,
        step: 0.01,
        label: 'Alpha',
      },
      maskCutoff: {
        value: DEFAULT_CUSTOM_SPLAT_CONFIG.maskCutoff,
        min: 0,
        max: 0.5,
        step: 0.001,
        label: 'Cutoff',
      },
      maskGamma: {
        value: DEFAULT_CUSTOM_SPLAT_CONFIG.maskGamma,
        min: 0.2,
        max: 3.0,
        step: 0.01,
        label: 'Mask Gamma',
      },
    },
    { collapsed: true }
  );
  const loadedMaskTextures = useLoader(
    THREE.TextureLoader,
    CUSTOM_SPLAT_TEXTURE_FILES
  );
  const selectedMaskTexture = React.useMemo(() => {
    if (customControls.texture === 'none') return null;

    const textureIndex = CUSTOM_SPLAT_TEXTURE_FILES.findIndex(
      (filePath) => filePath === imageFile(customControls.texture)
    );
    return textureIndex >= 0 ? loadedMaskTextures[textureIndex] : null;
  }, [customControls.texture, loadedMaskTextures]);

  return splats.map((splat, i) => (
    <TexturedSplat
      key={splat.id}
      src={modelFile(splat.src)}
      position={splat.positionArray}
      rotation={splat.rotation}
      splatDataTexture={selectedMaskTexture}
      sizeMultiplier={customControls.sizeMultiplier}
      alphaMultiplier={customControls.alphaMultiplier}
      maskCutoff={customControls.maskCutoff}
      maskGamma={customControls.maskGamma}
      onClick={splatClickHandlers[i]}
    />
  ));
}
