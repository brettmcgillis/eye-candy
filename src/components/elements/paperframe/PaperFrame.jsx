import { RepeatWrapping } from 'three';

import React, { useMemo } from 'react';

import { useGLTF, useTexture } from '@react-three/drei';

import { modelFile, textureFile } from '../../../utils/appUtils';

const WATERCOLOR_URL = textureFile('watercolor.png');

export default function PaperFrame(props) {
  const { nodes, materials } = useGLTF(modelFile(`FoldedFrame.glb`));
  const {
    frameColor,
    frameRoughness = 0.5,
    frameWatercolor = false,
    ...groupProps
  } = props;

  const watercolorTexture = useTexture(WATERCOLOR_URL);

  const frameMaterial = useMemo(() => {
    const material = materials['Material.002']?.clone();
    if (material && frameColor) {
      material.color.set(frameColor);
    }
    if (material) {
      material.roughness = frameRoughness;
      if (frameWatercolor) {
        watercolorTexture.wrapS = RepeatWrapping;
        watercolorTexture.wrapT = RepeatWrapping;
        watercolorTexture.repeat.set(3, 3);
        material.roughnessMap = watercolorTexture;
      } else {
        material.roughnessMap = null;
      }
      material.needsUpdate = true;
    }
    return material || materials['Material.002'];
  }, [
    materials,
    frameColor,
    frameRoughness,
    frameWatercolor,
    watercolorTexture,
  ]);

  return (
    <group {...groupProps} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Frame.geometry}
        material={frameMaterial}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`FoldedFrame.glb`));
useTexture.preload(WATERCOLOR_URL);
