import { button, useControls } from 'leva';

import React, { useCallback, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Flag from './components/Flag';
import FlagPole from './components/FlagPole';
import WebGPUOutline from './components/WebGPUOutline';
import useSceneControls, { TEXTURE_URLS } from './hooks/useSceneControls';

export default function Surrender() {
  const {
    rotateX,
    rotateY,
    rotateZ,
    posX,
    posY,
    clothWidth,
    clothHeight,
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
    keyPosX,
    keyPosY,
    keyPosZ,
    keyShadow,
    fillIntensity,
    fillColor,
    fillPosX,
    fillPosY,
    fillPosZ,
    outlineEnabled,
    edgeStrength,
    edgeThickness,
    visibleEdgeColor,
    downSampleRatio,
    patternType,
    patternScale,
    patternOctaves,
    patternLacunarity,
  } = useSceneControls();

  const outlineGroupRef = useRef();
  const flagRef = useRef();

  const resetSim = useCallback(() => {
    flagRef.current?.resetSim();
  }, []);

  useControls('Debug', { 'Reset Sim': button(resetSim) });

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
        position={[keyPosX, keyPosY, keyPosZ]}
        intensity={keyIntensity}
        color={keyColor}
        castShadow={keyShadow}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-1.5}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
      />
      <directionalLight
        position={[fillPosX, fillPosY, fillPosZ]}
        intensity={fillIntensity}
        color={fillColor}
      />

      {/* Pale blue-grey sky background */}
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, fogNear, fogFar]} />

      <group
        ref={outlineGroupRef}
        position={[posX, posY, 0]}
        rotation={[
          (rotateX * Math.PI) / 180,
          (rotateY * Math.PI) / 180,
          (rotateZ * Math.PI) / 180,
        ]}
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
          ref={flagRef}
          key={`${clothWidth}-${clothHeight}-${segmentsX}-${segmentsY}`}
          width={clothWidth}
          height={clothHeight}
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

      {outlineEnabled && (
        <WebGPUOutline
          meshRef={outlineGroupRef}
          edgeStrength={edgeStrength}
          edgeThickness={edgeThickness}
          visibleEdgeColor={visibleEdgeColor}
          downSampleRatio={downSampleRatio}
          patternType={patternType}
          patternScale={patternScale}
          patternOctaves={patternOctaves}
          patternLacunarity={patternLacunarity}
        />
      )}
    </>
  );
}
