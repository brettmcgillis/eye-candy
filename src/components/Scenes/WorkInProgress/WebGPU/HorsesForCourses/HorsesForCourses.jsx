import { Color } from 'three';

import React, { useCallback, useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import Godrays from '../../../../postprocessing/webGPU/godrays/Godrays';
import CameraRig from '../../../../rigging/CameraRig';
import BandedHorse from './components/BandedHorse';
import ButtonOverlay from './components/ButtonOverlay';
import SpotLighting from './components/SpotLighting';
import useAudioAnalyzer from './hooks/useAudioAnalyzer';
import useSceneControls from './hooks/useSceneControls';

function SceneBackground({ color }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new Color(color);
  }, [color, scene]);
  return null;
}

export default function HorsesForCourses() {
  const keyLightRef = useRef(null);
  const godraysLightRef = useRef(null);

  const {
    bandsRef,
    sourceMode,
    connectFile,
    connectMic,
    connectSystem,
    disconnect,
  } = useAudioAnalyzer();

  const {
    audioSource,
    audioMode,
    rustAudioDepth,
    camera,
    bandCount,
    sensitivity,
    metalness,
    roughness,
    rustAmount,
    rustScale,
    rustIterations,
    rustNoise,
    rustNoiseScale,
    rustSeed,
    baseColor,
    patinaColor,
    innerMetalness,
    innerRoughness,
    innerRustAmount,
    innerRustScale,
    innerIterations,
    innerNoise,
    innerNoiseScale,
    innerSeed,
    innerColor,
    ambientIntensity,
    keyIntensity,
    keyColor,
    rimIntensity,
    rimColor,
    fillIntensity,
    fillColor,
    bloomEnabled,
    bloomStrength,
    bloomThreshold,
    bloomRadius,
    bgColor,
    godraysEnabled,
    godraysBlendColor,
    godraysDensity,
    godraysMaxDensity,
    godraysDistanceAttenuation,
    godraysBlur,
    godraysEdgeRadius,
    godraysEdgeStrength,
  } = useSceneControls({ onConnectFile: connectFile });

  const prevSourceRef = useRef(null);
  useEffect(() => {
    if (audioSource === prevSourceRef.current) return;
    prevSourceRef.current = audioSource;
    if (audioSource === 'mic') connectMic();
    else if (audioSource === 'system') connectSystem();
  }, [audioSource, connectMic, connectSystem]);

  const handleMicClick = useCallback(() => {
    if (sourceMode === 'mic') disconnect();
    else connectMic();
  }, [sourceMode, connectMic, disconnect]);

  const handleScreenShareClick = useCallback(() => {
    if (sourceMode === 'system') disconnect();
    else connectSystem();
  }, [sourceMode, connectSystem, disconnect]);

  return (
    <>
      <CameraRig camera={camera} />

      <SceneBackground color={bgColor} />

      <SpotLighting
        keyLightRef={keyLightRef}
        godraysLightRef={godraysLightRef}
        ambientIntensity={ambientIntensity}
        keyIntensity={keyIntensity}
        keyColor={keyColor}
        rimIntensity={rimIntensity}
        rimColor={rimColor}
        fillIntensity={fillIntensity}
        fillColor={fillColor}
      />

      <BandedHorse
        audioMode={audioMode}
        rustAudioDepth={rustAudioDepth}
        bandCount={bandCount}
        sensitivity={sensitivity}
        metalness={metalness}
        roughness={roughness}
        rustAmount={rustAmount}
        rustScale={rustScale}
        rustIterations={rustIterations}
        rustNoise={rustNoise}
        rustNoiseScale={rustNoiseScale}
        rustSeed={rustSeed}
        baseColor={baseColor}
        patinaColor={patinaColor}
        innerMetalness={innerMetalness}
        innerRoughness={innerRoughness}
        innerRustAmount={innerRustAmount}
        innerRustScale={innerRustScale}
        innerIterations={innerIterations}
        innerNoise={innerNoise}
        innerNoiseScale={innerNoiseScale}
        innerSeed={innerSeed}
        innerColor={innerColor}
        bandsRef={bandsRef}
      />

      {godraysEnabled && (
        <Godrays
          lightRef={godraysLightRef}
          blendColor={godraysBlendColor}
          density={godraysDensity}
          maxDensity={godraysMaxDensity}
          distanceAttenuation={godraysDistanceAttenuation}
          blur={godraysBlur}
          edgeRadius={godraysEdgeRadius}
          edgeStrength={godraysEdgeStrength}
          bloomStrength={bloomEnabled ? bloomStrength : 0}
          bloomThreshold={bloomThreshold}
          bloomRadius={bloomRadius}
        />
      )}

      <ButtonOverlay
        sourceMode={sourceMode}
        onMicClick={handleMicClick}
        onScreenShareClick={handleScreenShareClick}
      />
    </>
  );
}
