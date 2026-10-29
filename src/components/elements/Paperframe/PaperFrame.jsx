import React, { memo, useEffect, useMemo } from 'react';

import { useGLTF, useTexture } from '@react-three/drei';

import { modelFile, textureFile } from '@utils/appUtils';

import { createFrame } from './frame';

const WATERCOLOR_URL = textureFile('watercolor.png');
function PaperFrame({
  frameColor,
  frameRoughness = 0.5,
  frameWatercolor = false,
  ...groupProps
}) {
  const gltf = useGLTF(modelFile('FoldedFrame.glb'));
  const texture = useTexture(WATERCOLOR_URL);
  const mesh = useMemo(
    () =>
      createFrame(
        gltf,
        { frameColor, frameRoughness, frameWatercolor },
        texture
      ),
    [gltf, frameColor, frameRoughness, frameWatercolor, texture]
  );
  useEffect(() => () => mesh.material.dispose(), [mesh]);
  return (
    <group {...groupProps}>
      <primitive object={mesh} dispose={null} />
    </group>
  );
}
export default memo(PaperFrame);
useGLTF.preload(modelFile('FoldedFrame.glb'));
useTexture.preload(WATERCOLOR_URL);
