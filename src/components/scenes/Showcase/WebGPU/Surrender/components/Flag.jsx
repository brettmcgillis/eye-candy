import React, { Suspense, forwardRef, memo, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import ClothMesh from '../../../../../elements/webgpu/cloth/ClothMesh';
import { pinEdge } from '../../../../../elements/webgpu/cloth/pinHelpers';

const FLAG_TOP_Y = 0.9;

const CLOTH_DEFAULTS = {
  gravity: 0.00005,
  windFrequency: 1,
  windAmplitude: 0.0001,
  stepsPerSecond: 360,
  origin: [0, FLAG_TOP_Y, 0],
};

// Renders the cloth with an already-resolved texture (or null).
const FlagCloth = forwardRef(function FlagCloth(
  {
    segmentsX,
    segmentsY,
    texture = null,
    textureUrl = null,
    color,
    roughness,
    metalness,
    opacity,
    wireframe,
    sheen,
    sheenRoughness,
    sheenColor,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    thickness,
    ...rest
  },
  ref
) {
  const pins = useMemo(
    () => pinEdge('left', segmentsX, segmentsY),
    [segmentsX, segmentsY]
  );

  return (
    <ClothMesh
      ref={ref}
      segmentsX={segmentsX}
      segmentsY={segmentsY}
      pins={pins}
      {...CLOTH_DEFAULTS}
      textureUrl={textureUrl}
      texture={texture}
      materialProps={{
        color,
        roughness,
        metalness,
        opacity,
        wireframe,
        sheen,
        sheenRoughness,
        sheenColor,
        clearcoat,
        clearcoatRoughness,
        transmission,
        ior,
        thickness,
      }}
      {...rest}
    />
  );
});

// Suspends until the texture is loaded, then renders FlagCloth with it.
const FlagWithTexture = forwardRef(function FlagWithTexture(
  { textureUrl, ...rest },
  ref
) {
  const texture = useTexture(textureUrl);
  return (
    <FlagCloth ref={ref} texture={texture} textureUrl={textureUrl} {...rest} />
  );
});

// Public API — holds rendering until texture is ready when one is provided.
const Flag = memo(
  forwardRef(function Flag({ textureUrl = null, ...rest }, ref) {
    if (!textureUrl) {
      return <FlagCloth ref={ref} textureUrl={null} texture={null} {...rest} />;
    }
    return (
      <Suspense fallback={null}>
        <FlagWithTexture ref={ref} textureUrl={textureUrl} {...rest} />
      </Suspense>
    );
  })
);

export default Flag;
