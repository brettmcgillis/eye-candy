import React, { useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import FluidMaterial from '../../../../materials/webGL/FluidMaterial/FluidMaterial';
import useFluidAutoPointers from '../../../TestLab/WebGL/FluidTest/hooks/useFluidAutoPointers';
import useFluidPointerInput from '../../../TestLab/WebGL/FluidTest/hooks/useFluidPointerInput';
import useFluidRandomSplats from '../../../TestLab/WebGL/FluidTest/hooks/useFluidRandomSplats';
import useFluidStationarySplats from '../../../TestLab/WebGL/FluidTest/hooks/useFluidStationarySplats';
import WatercolorMarkerLayer from './components/WatercolorMarkerLayer';
import useSceneControls from './hooks/useSceneControls';

export default function WatercolorSquares() {
  const { viewport, size } = useThree();

  const matRef = useRef();
  const randomSplatQueueRef = useRef(0);

  const { fluidConfig } = useSceneControls({ matRef, randomSplatQueueRef });

  const { pointerRef, pointerEvents } = useFluidPointerInput({ size });

  const autoPointersRef = useFluidAutoPointers({ config: fluidConfig, size });

  const randomSplatsRef = useFluidRandomSplats({
    config: fluidConfig,
    randomSplatQueueRef,
  });

  // Pass no pointerEvents — positions come from the preset, no drag-to-place.
  const { stationaryPointersRef, stationaryDebugMarkersRef } =
    useFluidStationarySplats({ config: fluidConfig, pointerEvents: {} });

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} />

      <mesh scale={[viewport.width, viewport.height, 1]} {...pointerEvents}>
        <planeGeometry args={[1, 1]} />
        <FluidMaterial
          ref={matRef}
          config={fluidConfig}
          pointerRef={pointerRef}
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
