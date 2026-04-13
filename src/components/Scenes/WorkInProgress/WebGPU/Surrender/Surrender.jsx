import React from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Flag from './components/Flag';
import FlagPole from './components/FlagPole';
import useSceneControls, { TEXTURE_URLS } from './hooks/useSceneControls';

export default function Surrender() {
  const {
    tiltZ,
    rotateY,
    posX,
    posY,
    wind,
    windDirX,
    windDirZ,
    stiffness,
    dampening,
    segmentsX,
    segmentsY,
    tatterSeed,
    tatterScale,
    tatterEdge,
    tatterHoles,
    paused,
    wireframe,
    sphere,
    sphereWireframe,
    sphereColor,
    sphereRadius,
    textureUrl,
    textureScaleX,
    textureScaleY,
    textureRotation,
    color,
    roughness,
    metalness,
    opacity,
    sheen,
    sheenRoughness,
    sheenColor,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    thickness,
    poleColor,
    poleMetalness,
    poleRoughness,
    finialColor,
    finialMetalness,
    finialRoughness,
    ringColor,
    ringMetalness,
    ringRoughness,
    bgColor,
    fogNear,
    fogFar,
    ambientIntensity,
    ambientColor,
    keyIntensity,
    keyColor,
    fillIntensity,
    fillColor,
  } = useSceneControls();

  return (
    <>
      <PerspectiveCamera makeDefault position={[-0.5, 0.0, 2.5]} fov={35} />
      <OrbitControls
        target={[0.25, 0.3, 0]}
        minDistance={1}
        maxDistance={5}
        enableDamping
      />

      {/* Soft overcast lighting to match the painting */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      <directionalLight
        position={[3, 4, 2]}
        intensity={keyIntensity}
        color={keyColor}
      />
      <directionalLight
        position={[-2, 1, -1]}
        intensity={fillIntensity}
        color={fillColor}
      />

      {/* Pale blue-grey sky background */}
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, fogNear, fogFar]} />

      <group
        position={[posX, posY, 0]}
        rotation={[0, (rotateY * Math.PI) / 180, (tiltZ * Math.PI) / 180]}
      >
        <FlagPole
          poleColor={poleColor}
          poleMetalness={poleMetalness}
          poleRoughness={poleRoughness}
          finialColor={finialColor}
          finialMetalness={finialMetalness}
          finialRoughness={finialRoughness}
          ringColor={ringColor}
          ringMetalness={ringMetalness}
          ringRoughness={ringRoughness}
        />
        <Flag
          key={`${segmentsX}-${segmentsY}`}
          segmentsX={segmentsX}
          segmentsY={segmentsY}
          wind={wind}
          windDirX={windDirX}
          windDirZ={windDirZ}
          stiffness={stiffness}
          dampening={dampening}
          paused={paused}
          wireframe={wireframe}
          sphereEnabled={sphere}
          sphereWireframe={sphereWireframe}
          sphereColor={sphereColor}
          sphereRadius={sphereRadius}
          tatterSeed={tatterSeed}
          tatterScale={tatterScale}
          tatterEdge={tatterEdge}
          tatterHoles={tatterHoles}
          textureUrl={textureUrl === 'None' ? null : textureUrl}
          preloadTextures={TEXTURE_URLS}
          textureScaleX={textureScaleX}
          textureScaleY={textureScaleY}
          textureRotation={textureRotation}
          color={color}
          roughness={roughness}
          metalness={metalness}
          opacity={opacity}
          sheen={sheen}
          sheenRoughness={sheenRoughness}
          sheenColor={sheenColor}
          clearcoat={clearcoat}
          clearcoatRoughness={clearcoatRoughness}
          transmission={transmission}
          ior={ior}
          thickness={thickness}
        />
      </group>
    </>
  );
}
