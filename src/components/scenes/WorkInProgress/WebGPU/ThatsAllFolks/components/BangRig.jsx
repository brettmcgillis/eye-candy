import * as THREE from 'three/webgpu';

import React, { Suspense, memo, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import ClothMesh from '../../../../../elements/webgpu/cloth/ClothMesh';
import { pinEdge } from '../../../../../elements/webgpu/cloth/pinHelpers';

function BangFlagCloth({ config, texture = null }) {
  const pins = useMemo(
    () => pinEdge('top', config.flagSegmentsX, config.flagSegmentsY),
    [config.flagSegmentsX, config.flagSegmentsY]
  );

  return (
    <ClothMesh
      width={config.flagWidth}
      height={config.flagHeight}
      segmentsX={config.flagSegmentsX}
      segmentsY={config.flagSegmentsY}
      pins={pins}
      shape="rectangle"
      origin={[0, 0, 0]}
      gravity={0.000045}
      windFrequency={1}
      windAmplitude={0.0001}
      stepsPerSecond={360}
      wind={config.flagWind}
      windDirX={config.flagWindDirX}
      windDirZ={config.flagWindDirZ}
      stiffness={config.flagStiffness}
      dampening={config.flagDampening}
      cursorCollider={config.flagCursorCollider}
      cursorRadius={config.flagCursorRadius}
      collisionMargin={config.flagCollisionMargin}
      textureUrl={config.flagTextureUrl || null}
      texture={texture}
      textureScaleX={config.flagTextureScaleX}
      textureScaleY={config.flagTextureScaleY}
      textureRotation={config.flagTextureRotation}
      textureTile={config.flagTextureTile}
      materialProps={{
        color: config.flagColor,
        roughness: config.flagRoughness,
        metalness: config.flagMetalness,
        opacity: config.flagOpacity,
        transparent: config.flagOpacity < 1,
        sheen: config.flagSheen,
        sheenRoughness: config.flagSheenRoughness,
        sheenColor: config.flagSheenColor,
        clearcoat: config.flagClearcoat,
        clearcoatRoughness: config.flagClearcoatRoughness,
      }}
    />
  );
}

function BangFlagWithTexture({ config }) {
  const texture = useTexture(config.flagTextureUrl);
  return <BangFlagCloth config={config} texture={texture} />;
}

const BangFlag = memo(function BangFlag({ config }) {
  if (!config.flagTextureUrl) {
    return <BangFlagCloth config={config} texture={null} />;
  }

  return (
    <Suspense fallback={null}>
      <BangFlagWithTexture config={config} />
    </Suspense>
  );
});

const BangRig = memo(function BangRig({ config, position, rotation }) {
  const barrelGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(
      config.barrelRadius,
      config.barrelRadius,
      config.barrelLength,
      Math.max(6, Math.round(config.barrelSegments))
    );
  }, [config.barrelLength, config.barrelRadius, config.barrelSegments]);

  const barrelMaterial = useMemo(() => {
    const material = new THREE.MeshStandardNodeMaterial();
    material.color.set(config.barrelColor);
    material.metalness = config.barrelMetalness;
    material.roughness = config.barrelRoughness;
    return material;
  }, [config.barrelColor, config.barrelMetalness, config.barrelRoughness]);

  // Keep the cloth aligned to the rod's far end so extra rod length
  // opens space between the gun and the flag instead of extending past it.
  const flagOffsetX = config.barrelLength - config.flagWidth;

  return (
    <group position={position} rotation={rotation}>
      <mesh
        position={[config.barrelLength * 0.5, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={barrelGeometry}
        castShadow
        receiveShadow
      >
        <primitive attach="material" object={barrelMaterial} />
      </mesh>
      <group position={[flagOffsetX, 0, 0]}>
        <BangFlag config={config} />
      </group>
    </group>
  );
});

export default BangRig;
