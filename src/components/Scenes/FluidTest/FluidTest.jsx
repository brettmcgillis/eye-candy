import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import FluidMaterial from './FluidMaterial';
import { FLUID_PRESETS } from './fluidPresets';
import useFluidAutoPointers from './useFluidAutoPointers';
import useFluidControls from './useFluidControls';
import useFluidRandomSplats from './useFluidRandomSplats';

function FullscreenPlane() {
  const { viewport, size } = useThree();
  const matRef = useRef();
  const lastRef = useRef(null);
  const downRef = useRef(false);
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

  const setPointer = useCallback((next) => {
    matRef.current?.setPointer(next);
  }, []);

  const updateFromEvent = useCallback(
    (e) => {
      if (!e.uv || !downRef.current) return;

      const { x, y } = e.uv;
      const prev = lastRef.current;
      let vx = prev ? x - prev.x : 0;
      let vy = prev ? y - prev.y : 0;

      if (size.width > size.height) {
        vx *= size.width / Math.max(1, size.height);
      } else {
        vy *= size.height / Math.max(1, size.width);
      }

      const pointer = { x, y, vx, vy, down: true };
      lastRef.current = pointer;
      setPointer(pointer);
    },
    [setPointer, size.height, size.width]
  );

  const clear = useCallback(() => {
    downRef.current = false;
    lastRef.current = null;
    setPointer(null);
  }, [setPointer]);

  const pointerEvents = useMemo(
    () => ({
      onPointerDown: (e) => {
        e.stopPropagation();
        downRef.current = true;
        e.target.setPointerCapture(e.pointerId);
        updateFromEvent(e);
      },
      onPointerMove: (e) => {
        e.stopPropagation();
        updateFromEvent(e);
      },
      onPointerUp: (e) => {
        e.stopPropagation();
        if (e.target.releasePointerCapture) {
          e.target.releasePointerCapture(e.pointerId);
        }
        clear();
      },
      onPointerCancel: (e) => {
        e.stopPropagation();
        if (e.target.releasePointerCapture) {
          e.target.releasePointerCapture(e.pointerId);
        }
        clear();
      },
      onPointerLeave: (e) => {
        e.stopPropagation();
        if (e.pointerType === 'mouse') clear();
      },
    }),
    [clear, updateFromEvent]
  );

  return (
    <mesh scale={[viewport.width, viewport.height, 1]} {...pointerEvents}>
      <planeGeometry args={[1, 1]} />
      <FluidMaterial
        ref={matRef}
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
