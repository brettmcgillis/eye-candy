import React, { forwardRef } from 'react';

import ClothMesh from '../../../../../elements/webgpu/cloth/ClothMesh';

const FLAG_TOP_Y = 0.9;

const Flag = forwardRef(function Flag(
  {
    segmentsX = 30,
    segmentsY = 21,
    wind = 1.0,
    windDirX = 1,
    windDirZ = -0.2,
    stiffness = 0.2,
    dampening = 0.99,
    paused = false,
    wireframe = false,
    sphereEnabled = true,
    sphereWireframe = false,
    sphereColor = '#ff0000',
    sphereRadius = 0.12,
    tatterSeed = 42,
    tatterScale = 3,
    tatterEdge = 0,
    tatterHoles = 0,
    textureUrl = null,
    preloadTextures = [],
    textureScaleX = 1,
    textureScaleY = 1,
    textureRotation = 0,
    color = '#f5f0e8',
    roughness = 0.65,
    metalness = 0.0,
    opacity = 1.0,
    sheen = 0,
    sheenRoughness = 0.5,
    sheenColor = '#ffffff',
    clearcoat = 0.0,
    clearcoatRoughness = 0.0,
    transmission = 0.0,
    ior = 1.5,
    thickness = 0.0,
  },
  ref
) {
  return (
    <ClothMesh
      ref={ref}
      width={1.0}
      height={0.7}
      segmentsX={segmentsX}
      segmentsY={segmentsY}
      pinEdge="left"
      origin={[0, FLAG_TOP_Y, 0]}
      gravity={0.00005}
      windFrequency={1}
      windAmplitude={0.0001}
      stepsPerSecond={360}
      wind={wind}
      windDirX={windDirX}
      windDirZ={windDirZ}
      stiffness={stiffness}
      dampening={dampening}
      paused={paused}
      sphereEnabled={sphereEnabled}
      sphereRadius={sphereRadius}
      sphereWireframe={sphereWireframe}
      sphereColor={sphereColor}
      tatterSeed={tatterSeed}
      tatterScale={tatterScale}
      tatterEdge={tatterEdge}
      tatterHoles={tatterHoles}
      textureUrl={textureUrl}
      preloadTextures={preloadTextures}
      textureScaleX={textureScaleX}
      textureScaleY={textureScaleY}
      textureRotation={textureRotation}
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
    />
  );
});

export default Flag;
