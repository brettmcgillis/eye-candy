/* eslint-disable no-nested-ternary */
import React, { useCallback, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import AudioToggleOverlay from '../../../../../app/scaffold/overlay/components/AudioToggleOverlay';
import useLoopedSceneAudio from '../../../../../hooks/useLoopedSceneAudio';
import Bloom from '../../../../postprocessing/webGPU/bloom/Bloom';
import OutlineFX from '../../../../postprocessing/webGPU/outline/Outline';
import FallingLeaves from './components/FallingLeaves';
import Flag from './components/Flag';
import FlagPole from './components/FlagPole';
import MoonlightProjector from './components/MoonlightProjector';
import ThunderLightning from './components/ThunderLightning';
import useCamera from './hooks/useCamera';
import usePhysicsState from './hooks/usePhysicsState';
import useSceneControls from './hooks/useSceneControls';

export default function Surrender() {
  const outlineGroupRef = useRef();
  const flagRef = useRef();

  const resetSim = useCallback(() => {
    flagRef.current?.resetSim();
  }, []);

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
    smoothEdges,
    paused,
    wireframe,
    cursorCollider,
    debugColliders,
    debugColor,
    cursorRadius,
    textureUrl,
    textureTile,
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
    leavesEnabled,
    leafMode,
    leafType,
    leafCount,
    leafSize,
    leafSpeed,
    leafSpeedJitter,
    leafTravel,
    leafTumble,
    leafCurvature,
    leafColor1,
    leafColor2,
    leafColor3,
    leafAspect,
    leafWindInfluence,
    thunderEnabled,
    thunderPeakIntensity,
    thunderMinGap,
    thunderMaxGap,
    thunderLightColor,
    moonColor,
    moonPeakIntensity,
    moonPosX,
    moonPosY,
    moonPosZ,
    moonAngle,
    cloudDensity,
    cloudContrast,
    cloudScale,
    cloudSpeed,
    cloudFloor,
    bloomEnabled,
    bloomThreshold,
    bloomStrength,
    bloomRadius,
    bloomDownSampleRatio,
    ambienceTrack,
  } = useSceneControls({ onResetSim: resetSim });

  useLoopedSceneAudio(ambienceTrack);
  const { cameraPosition, orbitTarget } = useCamera({ posX, posY });

  const leafModeNormalized = leafMode?.toLowerCase() ?? 'billboard';
  const scenePhysics = usePhysicsState({
    outlineGroupRef,
    clothWidth,
    clothHeight,
    wind,
    windDirX,
    windDirZ,
    cursorCollider:
      leavesEnabled &&
      (leafModeNormalized === 'cloth' ||
        (leafModeNormalized === 'billboard' && leafType === 'Blossoms')) &&
      cursorCollider,
    cursorRadius,
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPosition} fov={35} />
      <OrbitControls
        target={orbitTarget}
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
          smoothEdges={smoothEdges}
          textureUrl={textureUrl === 'None' ? null : textureUrl}
          textureTile={textureTile}
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

      <AudioToggleOverlay />
      {thunderEnabled && (
        <ThunderLightning
          bgBaseColor={bgColor}
          peakIntensity={thunderPeakIntensity}
          minGap={thunderMinGap}
          maxGap={thunderMaxGap}
          lightColor={thunderLightColor}
        />
      )}
      {thunderEnabled && (
        <MoonlightProjector
          color={moonColor}
          peakIntensity={moonPeakIntensity}
          posX={moonPosX}
          posY={moonPosY}
          posZ={moonPosZ}
          angle={moonAngle}
          cloudDensity={cloudDensity}
          cloudContrast={cloudContrast}
          cloudScale={cloudScale}
          cloudSpeed={cloudSpeed}
          cloudFloor={cloudFloor}
        />
      )}

      {leavesEnabled && (
        <FallingLeaves
          mode={leafModeNormalized}
          leafType={leafType}
          count={leafCount}
          curvature={leafCurvature}
          color1={leafColor1}
          color2={leafColor2}
          color3={leafColor3}
          leafSize={leafSize}
          leafAspect={leafAspect}
          speed={leafSpeed}
          speedJitter={leafSpeedJitter}
          cycleTravel={leafTravel}
          tumble={leafTumble}
          wireframe={wireframe}
          wind={wind}
          windDirX={windDirX}
          windDirZ={windDirZ}
          windInfluence={leafWindInfluence}
          scenePhysics={scenePhysics}
        />
      )}

      {bloomEnabled && (
        <Bloom
          threshold={bloomThreshold}
          strength={bloomStrength}
          radius={bloomRadius}
          downSampleRatio={bloomDownSampleRatio}
        />
      )}
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
