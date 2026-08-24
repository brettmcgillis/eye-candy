import React, { useCallback, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import FluidMaterial from '@materials/webGL/FluidMaterial/FluidMaterial';
import useFluidAutoPointers from '@materials/webGL/FluidMaterial/hooks/useFluidAutoPointers';
import useFluidHandsConfig from '@materials/webGL/FluidMaterial/hooks/useFluidHandsConfig';
import useFluidPointerInput from '@materials/webGL/FluidMaterial/hooks/useFluidPointerInput';
import useFluidRandomSplats from '@materials/webGL/FluidMaterial/hooks/useFluidRandomSplats';
import useFluidStationarySplats from '@materials/webGL/FluidMaterial/hooks/useFluidStationarySplats';
import { MAX_RANDOM_SPLATS } from '@materials/webGL/FluidMaterial/utils/constants';
import { FluidHandsBridge } from '@modules/handTracking';

import CardinalsMarkerLayer from './components/CardinalsMarkerLayer';
import useSceneControls from './hooks/useSceneControls';

export default function Cardinals() {
  const { viewport, size } = useThree();

  const matRef = useRef();
  const randomSplatQueueRef = useRef(0);
  const presetScrollIndexRef = useRef(0);
  const lastScrollTimeRef = useRef(0);

  const { fluidConfig, applyPresetByName, presetOptions, selectedPreset } =
    useSceneControls({ matRef, randomSplatQueueRef });

  const { pointerRef, pointerEvents } = useFluidPointerInput({ size });

  const handsPointerRef = useRef(null);
  const setHandsPointer = useCallback((pointer) => {
    handsPointerRef.current = pointer;
  }, []);
  const enqueueGestureBurst = useCallback(() => {
    randomSplatQueueRef.current += MAX_RANDOM_SPLATS;
  }, []);

  const autoPointersRef = useFluidAutoPointers({ config: fluidConfig, size });

  const randomSplatsRef = useFluidRandomSplats({
    config: fluidConfig,
    randomSplatQueueRef,
  });

  const { stationaryPointersRef, stationaryDebugMarkersRef } =
    useFluidStationarySplats({ config: fluidConfig, pointerEvents: {} });

  const { mediaPipeConfig, handControlConfig } =
    useFluidHandsConfig(fluidConfig);

  // Keep preset scroll index in sync with selectedPreset.
  React.useEffect(() => {
    const idx = presetOptions.indexOf(selectedPreset);
    if (idx !== -1) presetScrollIndexRef.current = idx;
  }, [presetOptions, selectedPreset]);

  // Advance to the next preset on an interval when scroll is enabled.
  useFrame(({ clock }) => {
    if (!fluidConfig.presetScrollEnabled) return;
    const interval = fluidConfig.presetScrollInterval || 5;
    const now = clock.elapsedTime;
    if (now - lastScrollTimeRef.current < interval) return;
    lastScrollTimeRef.current = now;
    presetScrollIndexRef.current =
      (presetScrollIndexRef.current + 1) % presetOptions.length;
    applyPresetByName(presetOptions[presetScrollIndexRef.current]);
  });

  const usingHands = fluidConfig.inputMode === 'hands';
  const activePointerRef = usingHands ? handsPointerRef : pointerRef;
  const meshPointerEvents = usingHands ? {} : pointerEvents;

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} />

      {usingHands && (
        <FluidHandsBridge
          gesturesEnabled={!!fluidConfig.gesturesEnabled}
          handControlConfig={handControlConfig}
          invertX={!!fluidConfig.handsInvertX}
          invertY={!!fluidConfig.handsInvertY}
          mediaPipeConfig={mediaPipeConfig}
          onGestureBurst={enqueueGestureBurst}
          onPointerChange={setHandsPointer}
          size={size}
        />
      )}

      <mesh scale={[viewport.width, viewport.height, 1]} {...meshPointerEvents}>
        <planeGeometry args={[1, 1]} />
        <FluidMaterial
          ref={matRef}
          config={fluidConfig}
          pointerRef={activePointerRef}
          autoPointersRef={autoPointersRef}
          stationaryPointersRef={stationaryPointersRef}
          stationaryDebugMarkersRef={stationaryDebugMarkersRef}
          randomSplatsRef={randomSplatsRef}
        />
      </mesh>

      <CardinalsMarkerLayer
        fluidConfig={fluidConfig}
        viewport={viewport}
        autoPointersRef={autoPointersRef}
        pointerRef={activePointerRef}
      />
    </>
  );
}
