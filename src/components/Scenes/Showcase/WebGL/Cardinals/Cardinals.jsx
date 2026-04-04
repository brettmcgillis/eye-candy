import * as THREE from 'three';

import React, { useCallback, useMemo, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import useHandGestureEvents from '../../../../../hooks/hands/useHandGestureEvents';
import useHandControls, {
  mapWorldToScreenUv,
} from '../../../../../hooks/hands/useHandcontrols';
import useMediaPipeHands from '../../../../../hooks/hands/useMediaPipeHands';
import FluidMaterial from '../../../../materials/webGL/FluidMaterial/FluidMaterial';
import { MAX_RANDOM_SPLATS } from '../../../../materials/webGL/FluidMaterial/utils/constants';
import useFluidAutoPointers from '../../../TestLab/WebGL/FluidTest/hooks/useFluidAutoPointers';
import useFluidPointerInput from '../../../TestLab/WebGL/FluidTest/hooks/useFluidPointerInput';
import useFluidRandomSplats from '../../../TestLab/WebGL/FluidTest/hooks/useFluidRandomSplats';
import useFluidStationarySplats from '../../../TestLab/WebGL/FluidTest/hooks/useFluidStationarySplats';
import CardinalsMarkerLayer from './components/CardinalsMarkerLayer';
import useSceneControls from './hooks/useSceneControls';

const GESTURE_BURST_COOLDOWN_MS = 350;

function CardinalsHandsBridge({
  onPointerChange,
  onGestureBurst,
  size,
  mediaPipeConfig,
  handControlConfig,
  invertX,
  invertY,
  gesturesEnabled,
}) {
  const previousByHandRef = useRef(new Map());
  const lastGestureBurstRef = useRef(0);

  const handResults = useMediaPipeHands(mediaPipeConfig);
  const hands = useHandControls(handResults, handControlConfig);

  useHandGestureEvents(hands, {
    onGestureStart: (gesture) => {
      if (!gesturesEnabled || gesture === 'IDLE' || !onGestureBurst) return;
      const now = Date.now();
      if (now - lastGestureBurstRef.current < GESTURE_BURST_COOLDOWN_MS) return;
      lastGestureBurstRef.current = now;
      onGestureBurst(gesture);
    },
  });

  React.useEffect(() => {
    const handList = hands?.hands || [];

    if (handList.length === 0) {
      previousByHandRef.current.clear();
      onPointerChange(null);
      return;
    }

    const maxHands = Math.max(1, Math.floor(handControlConfig.maxHands || 1));
    const activeHands = handList.slice(0, maxHands);
    const nextPrevByHand = new Map();
    const nextPointers = [];

    for (let i = 0; i < activeHands.length; i += 1) {
      const hand = activeHands[i];
      if (hand?.position) {
        const mapped = mapWorldToScreenUv(hand.position, {
          xScale: handControlConfig.xScale || 4,
          yScale: handControlConfig.yScale || 3,
          mirrorX: false,
          mirrorY: true,
        });
        const targetX = invertX ? 1 - mapped.x : mapped.x;
        const targetY = invertY ? 1 - mapped.y : mapped.y;
        const prev = previousByHandRef.current.get(hand.index);

        const x = prev ? THREE.MathUtils.lerp(prev.x, targetX, 0.35) : targetX;
        const y = prev ? THREE.MathUtils.lerp(prev.y, targetY, 0.35) : targetY;

        let vx = prev ? x - prev.x : 0;
        let vy = prev ? y - prev.y : 0;

        if (size.width > size.height) {
          vx *= size.width / Math.max(1, size.height);
        } else {
          vy *= size.height / Math.max(1, size.width);
        }

        nextPointers.push({ x, y, vx, vy, down: true });
        nextPrevByHand.set(hand.index, { x, y });
      }
    }

    previousByHandRef.current = nextPrevByHand;
    onPointerChange(nextPointers.length > 0 ? nextPointers : null);
  }, [
    handControlConfig.maxHands,
    handControlConfig.xScale,
    handControlConfig.yScale,
    hands,
    invertX,
    invertY,
    onPointerChange,
    size.height,
    size.width,
  ]);

  React.useEffect(
    () => () => {
      previousByHandRef.current.clear();
      onPointerChange(null);
    },
    [onPointerChange]
  );

  return null;
}

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

  const mediaPipeConfig = useMemo(
    () => ({
      maxHands: fluidConfig.handsMaxHands || 1,
      modelComplexity: fluidConfig.handsModelComplexity || 1,
      minDetectionConfidence: fluidConfig.handsMinDetectionConfidence || 0.6,
      minTrackingConfidence: fluidConfig.handsMinTrackingConfidence || 0.6,
      showVideo: !!fluidConfig.handsShowVideo,
      showDebugSkeleton: !!fluidConfig.handsShowDebugSkeleton,
      landmarkStyle: {
        color: fluidConfig.handsLandmarkColor || '#ff0000',
        radius: fluidConfig.handsLandmarkRadius || 4,
      },
      connectorStyle: {
        color: fluidConfig.handsConnectorColor || '#000000',
        lineWidth: fluidConfig.handsConnectorLineWidth || 3,
      },
    }),
    [
      fluidConfig.handsConnectorColor,
      fluidConfig.handsConnectorLineWidth,
      fluidConfig.handsLandmarkColor,
      fluidConfig.handsLandmarkRadius,
      fluidConfig.handsMaxHands,
      fluidConfig.handsMinDetectionConfidence,
      fluidConfig.handsMinTrackingConfidence,
      fluidConfig.handsModelComplexity,
      fluidConfig.handsShowDebugSkeleton,
      fluidConfig.handsShowVideo,
    ]
  );

  const handControlConfig = useMemo(
    () => ({
      maxHands: fluidConfig.handsMaxHands || 1,
      xScale: fluidConfig.handsXScale || 4,
      yScale: fluidConfig.handsYScale || 3,
      zScale: fluidConfig.handsZScale || 5,
    }),
    [
      fluidConfig.handsMaxHands,
      fluidConfig.handsXScale,
      fluidConfig.handsYScale,
      fluidConfig.handsZScale,
    ]
  );

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
        <CardinalsHandsBridge
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
