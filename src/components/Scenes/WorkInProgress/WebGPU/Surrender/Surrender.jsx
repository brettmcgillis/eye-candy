import { button, useControls } from 'leva';

import React, { useCallback, useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import OutlineFX from '../../../../postprocessing/webGPU/outline/Outline';
import Flag from './components/Flag';
import FlagPole from './components/FlagPole';
import useSceneControls, { TEXTURE_URLS } from './hooks/useSceneControls';

export default function Surrender() {
  const {
    orbitControls,
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
    alphaSeed,
    alphaScale,
    edgeFade,
    holeAmount,
    tatterEdge,
    paused,
    wireframe,
    cursorCollider,
    debugColliders,
    debugColor,
    cursorRadius,
    textureUrl,
    textureScaleX,
    textureScaleY,
    textureRotation,
    flagColor,
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
    materialThickness,
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
    enabled,
    mode,
    strength,
    thickness: outlineThickness,
    color: outlineColor,
    hiddenColor,
    hiddenStrength,
    glow,
    inside,
    downSampleRatio,
    patternScale,
    patternOctaves,
    patternLacunarity,
    ringStride,
    halftoneScale,
  } = useSceneControls();

  const outlineGroupRef = useRef();
  const flagRef = useRef();

  const resetSim = useCallback(() => {
    flagRef.current?.resetSim();
  }, []);

  useControls('Debug', { 'Reset Sim': button(resetSim) });

  // Responsive camera: frame flag + finial, pull back on narrow (mobile) viewports
  const size = useThree((state) => state.size);
  const isPortrait = size.width < size.height;
  const cameraPosition = useMemo(() => {
    if (isPortrait) {
      // Mobile/portrait: pull back so the full flag is visible
      return [-0.5, 0.0, 3.8];
    }
    // Desktop/landscape: original framing with upward viewing angle
    return [-0.5, 0.0, 2.5];
  }, [isPortrait]);

  const TARGET = [0.25, 0.3, 0];

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPosition} fov={35} />
      <OrbitControls
        target={TARGET}
        minDistance={1}
        maxDistance={5}
        enableDamping
        enableRotate={orbitControls}
        enableZoom={orbitControls}
        enablePan={orbitControls}
        makeDefault
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
          cursorCollider={cursorCollider}
          cursorRadius={cursorRadius}
          debugColliders={debugColliders}
          debugColor={debugColor}
          alphaSeed={alphaSeed}
          alphaScale={alphaScale}
          edgeFade={edgeFade}
          holeAmount={holeAmount}
          tatterEdge={tatterEdge}
          textureUrl={textureUrl === 'None' ? null : textureUrl}
          preloadTextures={TEXTURE_URLS}
          textureScaleX={textureScaleX}
          textureScaleY={textureScaleY}
          textureRotation={textureRotation}
          color={flagColor}
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
          thickness={materialThickness}
        />
      </group>

      <OutlineFX
        enabled={enabled}
        targetRef={outlineGroupRef}
        mode={mode}
        color={outlineColor}
        hiddenColor={hiddenColor}
        hiddenStrength={hiddenStrength}
        strength={strength}
        thickness={outlineThickness}
        glow={glow}
        inside={inside}
        downSampleRatio={downSampleRatio}
        patternScale={patternScale}
        patternOctaves={patternOctaves}
        patternLacunarity={patternLacunarity}
        ringStride={ringStride}
        halftoneScale={halftoneScale}
      />
    </>
  );
}
