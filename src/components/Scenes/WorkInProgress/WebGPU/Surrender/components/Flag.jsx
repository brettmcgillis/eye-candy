import React, { forwardRef, memo, useMemo } from 'react';

import ClothMesh from '../../../../../elements/webgpu/cloth/ClothMesh';
import { pinEdge } from '../../../../../elements/webgpu/cloth/pinHelpers';

const FLAG_TOP_Y = 0.9;

const Flag = memo(
  forwardRef(function Flag(
    {
      width = 1.0,
      height = 0.7,
      segmentsX = 30,
      segmentsY = 21,
      wind = 1.0,
      windDirX = 1,
      windDirZ = -0.2,
      stiffness = 0.2,
      dampening = 0.99,
      paused = false,
      wireframe = false,
      cursorCollider = true,
      cursorRadius = 0.12,
      colliders = [],
      debugColliders = false,
      debugColor = '#ff0000',
      alphaSeed = 42,
      alphaScale = 3,
      edgeFade = 0,
      holeAmount = 0,
      tatterEdge = 0,
      cutouts = [],
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
    const pins = useMemo(
      () => pinEdge('left', segmentsX, segmentsY),
      [segmentsX, segmentsY]
    );

    return (
      <ClothMesh
        ref={ref}
        width={width}
        height={height}
        segmentsX={segmentsX}
        segmentsY={segmentsY}
        pins={pins}
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
        cursorCollider={cursorCollider}
        cursorRadius={cursorRadius}
        colliders={colliders}
        debugColliders={debugColliders}
        debugColor={debugColor}
        alphaSeed={alphaSeed}
        alphaScale={alphaScale}
        edgeFade={edgeFade}
        holeAmount={holeAmount}
        tatterEdge={tatterEdge}
        cutouts={cutouts}
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
  })
);

export default Flag;
