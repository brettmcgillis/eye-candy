import React, { memo, useCallback } from 'react';

import { useTexture } from '@react-three/drei';

import { imageFile, videoFile } from '../../../../../../utils/appUtils';
import BusstopModel from '../../../../../elements/Busstop/Busstop';
import CRTAdGlitchMaterial from '../../../../../materials/webGPU/crt/crtAdGlitchMaterial';

// Shared art playlist — every ad face cycles through all of it (videos + the Aisle9
// logo stills), so given enough time each panel shows every piece.
const AD_ART = [
  { type: 'video', src: videoFile('watercolor.mp4') },
  { type: 'video', src: videoFile('bluejays.mp4') },
  { type: 'video', src: videoFile('electronMicroscopy.mp4') },
  { type: 'video', src: videoFile('enlightened.mp4') },
  { type: 'video', src: videoFile('extinguished.mp4') },
  { type: 'image', src: imageFile('aisle9/Aisle9Logo-NowHiring.png') },
  { type: 'image', src: imageFile('aisle9/Aisle9Logo-ApplyNow.png') },
  { type: 'image', src: imageFile('TagFaded.png') },
  { type: 'image', src: imageFile('DrippingSquares.png') },
];

// Preload the still images so the first cycle to a logo frame is instant (videos
// stream and can't be preloaded the same way).
useTexture.preload(AD_ART.filter((a) => a.type === 'image').map((a) => a.src));

// Per overridable ad face (the InsideBack route map is left alone): where it starts in
// the cycle so the three panels stay out of sync. flipX/flipY correct mirrored atlas
// UVs (toggle if a face reads backwards or upside-down).
const AD_FACES = {
  BusStop_Sign_InsideRight: { startOffset: 0 },
  BusStop_Sign_OutsideBack: { startOffset: 2 },
  BusStop_Sign_OutsideRight: { startOffset: 4 },
};

// The bus stop with its three advertisement faces overridden by the CRT ad-glitch
// material (the others keep their GLTF material). Ad art/glitch tuning comes straight
// from the scene's "Ads" controls.
function BusStop({
  artScaleX,
  artScaleY,
  artOffsetX,
  artOffsetY,
  artBg,
  glitchTile,
  glitchWidth,
  glitchHeight,
  glitchMinGap,
  glitchMaxGap,
  glitchDuration,
  glitchStutter,
  ...props
}) {
  // `uvRect` (from the Busstop element) normalizes each face's atlas sub-rect so the
  // override material maps consistently across all three panels.
  const renderAd = useCallback(
    (name, uvRect) => {
      const face = AD_FACES[name];
      if (!face) return null;
      return (
        <CRTAdGlitchMaterial
          artSources={AD_ART}
          startOffset={face.startOffset}
          uvOrigin={uvRect.origin}
          uvSpan={uvRect.span}
          flipX={face.flipX}
          flipY={face.flipY}
          artScale={{ x: artScaleX, y: artScaleY }}
          artOffset={{ x: artOffsetX, y: artOffsetY }}
          artBg={artBg}
          textTile={glitchTile}
          textWidth={glitchWidth}
          textHeight={glitchHeight}
          artMinDur={glitchMinGap}
          artMaxDur={glitchMaxGap}
          glitchDuration={glitchDuration}
          glitchStutter={glitchStutter}
        />
      );
    },
    [
      artScaleX,
      artScaleY,
      artOffsetX,
      artOffsetY,
      artBg,
      glitchTile,
      glitchWidth,
      glitchHeight,
      glitchMinGap,
      glitchMaxGap,
      glitchDuration,
      glitchStutter,
    ]
  );

  return <BusstopModel renderAd={renderAd} {...props} />;
}

export default memo(BusStop);
