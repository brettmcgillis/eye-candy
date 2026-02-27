import * as THREE from 'three';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import useHandGestureEvents from '../../../hooks/hands/useHandGestureEvents';
import useHandControls, {
  mapWorldToScreenUv,
} from '../../../hooks/hands/useHandcontrols';
import useMediaPipeHands from '../../../hooks/hands/useMediaPipeHands';
import FluidMaterial from './FluidMaterial';
import { FLUID_PRESETS, RANDOM_BURST_COUNT } from './fluidPresets';
import useFluidAutoPointers from './hooks/useFluidAutoPointers';
import useFluidControls from './hooks/useFluidControls';
import useFluidPointerInput from './hooks/useFluidPointerInput';
import useFluidRandomSplats from './hooks/useFluidRandomSplats';

const GESTURE_BURST_COOLDOWN_MS = 350;

function FluidHandsPointerBridge({
  onPointerChange,
  onGestureBurst,
  size,
  mediaPipeConfig,
  handControlConfig,
  invertX,
  invertY,
  gesturesEnabled,
}) {
  const previousRef = useRef(null);
  const lastGestureBurstRef = useRef(0);

  const handResults = useMediaPipeHands(mediaPipeConfig);
  const hands = useHandControls(handResults, handControlConfig);

  useHandGestureEvents(hands, {
    onGestureStart: (gesture) => {
      if (!gesturesEnabled || gesture === 'IDLE' || !onGestureBurst) return;

      const now = Date.now();
      if (now - lastGestureBurstRef.current < GESTURE_BURST_COOLDOWN_MS) {
        return;
      }

      lastGestureBurstRef.current = now;
      onGestureBurst(gesture);
    },
  });

  useEffect(() => {
    const primaryPos = hands?.primary?.position || hands?.hands?.[0]?.position;

    if (!primaryPos) {
      previousRef.current = null;
      onPointerChange(null);
      return;
    }

    const mapped = mapWorldToScreenUv(primaryPos, {
      xScale: handControlConfig.xScale || 4,
      yScale: handControlConfig.yScale || 3,
      mirrorX: false,
      mirrorY: true,
    });
    const targetX = invertX ? 1 - mapped.x : mapped.x;
    const targetY = invertY ? 1 - mapped.y : mapped.y;
    const prev = previousRef.current;

    const x = prev ? THREE.MathUtils.lerp(prev.x, targetX, 0.35) : targetX;
    const y = prev ? THREE.MathUtils.lerp(prev.y, targetY, 0.35) : targetY;

    let vx = prev ? x - prev.x : 0;
    let vy = prev ? y - prev.y : 0;

    if (size.width > size.height) {
      vx *= size.width / Math.max(1, size.height);
    } else {
      vy *= size.height / Math.max(1, size.width);
    }

    onPointerChange({ x, y, vx, vy, down: true });
    previousRef.current = { x, y };
  }, [
    handControlConfig.xScale,
    handControlConfig.yScale,
    hands,
    invertX,
    invertY,
    onPointerChange,
    size.height,
    size.width,
  ]);

  useEffect(
    () => () => {
      previousRef.current = null;
      onPointerChange(null);
    },
    [onPointerChange]
  );

  return null;
}

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
  const { pointerRef: pointerInputRef, pointerEvents } = useFluidPointerInput({
    size,
  });
  const handsPointerRef = useRef(null);
  const setHandsPointer = useCallback((pointer) => {
    handsPointerRef.current = pointer;
  }, []);
  const enqueueGestureBurst = useCallback(() => {
    randomSplatQueueRef.current += RANDOM_BURST_COUNT;
  }, []);

  const mediaPipeConfig = useMemo(
    () => ({
      maxHands: fluidValues.handsMaxHands || 1,
      modelComplexity: fluidValues.handsModelComplexity || 1,
      minDetectionConfidence: fluidValues.handsMinDetectionConfidence || 0.6,
      minTrackingConfidence: fluidValues.handsMinTrackingConfidence || 0.6,
      showVideo: !!fluidValues.handsShowVideo,
      showDebugSkeleton: !!fluidValues.handsShowDebugSkeleton,
      landmarkStyle: {
        color: fluidValues.handsLandmarkColor || '#ff0000',
        radius: fluidValues.handsLandmarkRadius || 4,
      },
      connectorStyle: {
        color: fluidValues.handsConnectorColor || '#000000',
        lineWidth: fluidValues.handsConnectorLineWidth || 3,
      },
    }),
    [
      fluidValues.handsConnectorColor,
      fluidValues.handsConnectorLineWidth,
      fluidValues.handsLandmarkColor,
      fluidValues.handsLandmarkRadius,
      fluidValues.handsMaxHands,
      fluidValues.handsMinDetectionConfidence,
      fluidValues.handsMinTrackingConfidence,
      fluidValues.handsModelComplexity,
      fluidValues.handsShowDebugSkeleton,
      fluidValues.handsShowVideo,
    ]
  );

  const handControlConfig = useMemo(
    () => ({
      maxHands: fluidValues.handsMaxHands || 1,
      xScale: fluidValues.handsXScale || 4,
      yScale: fluidValues.handsYScale || 3,
      zScale: fluidValues.handsZScale || 5,
    }),
    [
      fluidValues.handsMaxHands,
      fluidValues.handsXScale,
      fluidValues.handsYScale,
      fluidValues.handsZScale,
    ]
  );

  const inputMode = fluidValues.inputMode || 'pointer';
  const usingHands = inputMode === 'hands';
  const activePointerRef = usingHands ? handsPointerRef : pointerInputRef;
  const meshPointerEvents = usingHands ? {} : pointerEvents;

  return (
    <>
      {usingHands && (
        <FluidHandsPointerBridge
          gesturesEnabled={!!fluidValues.gesturesEnabled}
          handControlConfig={handControlConfig}
          invertX={!!fluidValues.handsInvertX}
          invertY={!!fluidValues.handsInvertY}
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
          pointerRef={activePointerRef}
          config={fluidValues}
          autoPointersRef={autoPointersRef}
          randomSplatsRef={randomSplatsRef}
        />
      </mesh>
    </>
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
