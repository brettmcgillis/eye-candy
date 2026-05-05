import { RepeatWrapping } from 'three';

import React from 'react';

import { useTexture } from '@react-three/drei';

import { textureFile } from '../../../../../../utils/appUtils';

const WATERCOLOR_URL = textureFile('watercolor.png');

function SquareMaterial({
  color,
  emissive,
  emissiveIntensity,
  roughness,
  metalness,
  flatShading,
  watercolor,
  roughnessTexture,
}) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      roughness={roughness}
      metalness={metalness}
      flatShading={flatShading}
      roughnessMap={watercolor ? roughnessTexture : null}
    />
  );
}

export default function Square({
  size,
  position,
  color,
  settings,
  isMainHighlighted = false,
  isMirrorHighlighted = false,
  highlightColor = '#ff2020',
  highlightEmissiveIntensity = 1.5,
  highlightStrength = 1,
  roughness = 1,
  metalness = 0,
  flatShading = false,
  watercolor = false,
}) {
  const roughnessTexture = useTexture(WATERCOLOR_URL);
  roughnessTexture.wrapS = RepeatWrapping;
  roughnessTexture.wrapT = RepeatWrapping;
  roughnessTexture.repeat.set(2, 2);
  const [x, y] = position;
  const mirror = settings.symmetric && (x !== 0 || y !== 0);
  const materialColor = isMainHighlighted ? highlightColor : color;
  const emissiveColor = isMainHighlighted ? highlightColor : '#000000';
  const emissiveIntensity = isMainHighlighted
    ? highlightEmissiveIntensity * highlightStrength
    : 0;
  const mirrorMaterialColor = isMirrorHighlighted ? highlightColor : color;
  const mirrorEmissiveColor = isMirrorHighlighted ? highlightColor : '#000000';
  const mirrorEmissiveIntensity = isMirrorHighlighted
    ? highlightEmissiveIntensity * highlightStrength
    : 0;

  return (
    <>
      <mesh position={[x, y, 0]}>
        <boxGeometry args={[size, size, settings.paperDepth]} />
        <SquareMaterial
          color={materialColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={roughness}
          metalness={metalness}
          flatShading={flatShading}
          watercolor={watercolor}
          roughnessTexture={roughnessTexture}
        />
      </mesh>
      {mirror && (
        <mesh castShadow receiveShadow position={[-x, -y, 0]}>
          <boxGeometry args={[size, size, settings.paperDepth]} />
          <SquareMaterial
            color={mirrorMaterialColor}
            emissive={mirrorEmissiveColor}
            emissiveIntensity={mirrorEmissiveIntensity}
            roughness={roughness}
            metalness={metalness}
            flatShading={flatShading}
            watercolor={watercolor}
            roughnessTexture={roughnessTexture}
          />
        </mesh>
      )}
    </>
  );
}

useTexture.preload(WATERCOLOR_URL);
