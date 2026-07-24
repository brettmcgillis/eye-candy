import React, { useCallback, useMemo, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { designToFluidUV } from '../../../../elements/marker/markerUtils';
import FluidHandsBridge from '../../../../hands/FluidHandsBridge';
import FluidMaterial from '../../../../materials/webGL/FluidMaterial/FluidMaterial';
import useFluidAutoPointers from '../../../../materials/webGL/FluidMaterial/hooks/useFluidAutoPointers';
import useFluidHandsConfig from '../../../../materials/webGL/FluidMaterial/hooks/useFluidHandsConfig';
import useFluidPointerInput from '../../../../materials/webGL/FluidMaterial/hooks/useFluidPointerInput';
import useFluidRandomSplats from '../../../../materials/webGL/FluidMaterial/hooks/useFluidRandomSplats';
import useFluidStationarySplats from '../../../../materials/webGL/FluidMaterial/hooks/useFluidStationarySplats';
import { MAX_RANDOM_SPLATS } from '../../../../materials/webGL/FluidMaterial/utils/constants';
import WatercolorMarkerLayer from './components/WatercolorMarkerLayer';
import useSceneControls from './hooks/useSceneControls';

export default function WatercolorSquares() {
  const { viewport, size } = useThree();

  const matRef = useRef();
  const randomSplatQueueRef = useRef(0);

  const { fluidConfig } = useSceneControls({ matRef, randomSplatQueueRef });

  // Positions in the preset use height-normalised design UV (x scales with
  // viewport.height). The fluid simulation operates in full-viewport UV space,
  // so x must be aspect-corrected before passing to the fluid sim.
  const effectiveFluidConfig = useMemo(() => {
    const adj = (pts) =>
      pts?.map((p) => ({ ...p, ...designToFluidUV(p.x, p.y, viewport) }));
    return {
      ...fluidConfig,
      stationarySplats: adj(fluidConfig.stationarySplats),
      stationaryDebugMarkers: adj(fluidConfig.stationaryDebugMarkers),
      autoSplatStarts: adj(fluidConfig.autoSplatStarts),
    };
  }, [fluidConfig, viewport]);

  const { pointerRef, pointerEvents } = useFluidPointerInput({ size });

  const handsPointerRef = useRef(null);
  const setHandsPointer = useCallback((pointer) => {
    handsPointerRef.current = pointer;
  }, []);
  const enqueueGestureBurst = useCallback(() => {
    randomSplatQueueRef.current += MAX_RANDOM_SPLATS;
  }, []);

  const autoPointersRef = useFluidAutoPointers({
    config: effectiveFluidConfig,
    size,
  });

  const randomSplatsRef = useFluidRandomSplats({
    config: effectiveFluidConfig,
    randomSplatQueueRef,
  });

  // Pass no pointerEvents — positions come from the preset, no drag-to-place.
  const { stationaryPointersRef, stationaryDebugMarkersRef } =
    useFluidStationarySplats({
      config: effectiveFluidConfig,
      pointerEvents: {},
    });

  const { mediaPipeConfig, handControlConfig } =
    useFluidHandsConfig(fluidConfig);

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
          config={effectiveFluidConfig}
          pointerRef={activePointerRef}
          autoPointersRef={autoPointersRef}
          stationaryPointersRef={stationaryPointersRef}
          stationaryDebugMarkersRef={stationaryDebugMarkersRef}
          randomSplatsRef={randomSplatsRef}
        />
      </mesh>

      <WatercolorMarkerLayer fluidConfig={fluidConfig} viewport={viewport} />
    </>
  );
}
