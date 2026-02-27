import React, { useEffect, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import FluidMaterial from './FluidMaterial';
import { FLUID_PRESETS } from './fluidPresets';
import useFluidAutoPointers from './hooks/useFluidAutoPointers';
import useFluidControls from './hooks/useFluidControls';
import useFluidPointerInput from './hooks/useFluidPointerInput';
import useFluidRandomSplats from './hooks/useFluidRandomSplats';

function FullscreenPlane() {
  const { viewport, size } = useThree();
  const matRef = useRef();
  const presetRef = useRef('default');
  const randomSplatQueueRef = useRef(0);

  const [fluidValues, setControls] = useFluidControls({
    presetRef,
    randomSplatQueueRef,
    resetSimRef: matRef,
  });

  useEffect(() => {
    const currentPresetKey = presetRef.current || 'default';
    const nextPreset = FLUID_PRESETS[currentPresetKey];
    if (nextPreset) setControls(nextPreset);
  }, [setControls]);

  const autoPointersRef = useFluidAutoPointers({
    config: fluidValues,
    size,
  });
  const randomSplatsRef = useFluidRandomSplats({
    config: fluidValues,
    randomSplatQueueRef,
  });
  const { pointerRef, pointerEvents } = useFluidPointerInput({ size });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]} {...pointerEvents}>
      <planeGeometry args={[1, 1]} />
      <FluidMaterial
        ref={matRef}
        pointerRef={pointerRef}
        config={fluidValues}
        autoPointersRef={autoPointersRef}
        randomSplatsRef={randomSplatsRef}
      />
    </mesh>
  );
}

export default function FluidTest() {
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} />
      <FullscreenPlane />
    </>
  );
}
