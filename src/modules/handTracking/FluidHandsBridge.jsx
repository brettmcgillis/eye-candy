import { useEffect, useRef } from 'react';

import * as THREE from 'three';

import useHandGestureEvents from './useHandGestureEvents';
import useHandControls, { mapWorldToScreenUv } from './useHandcontrols';
import useMediaPipeHands from './useMediaPipeHands';

const GESTURE_BURST_COOLDOWN_MS = 350;

/**
 * Shared bridge component that converts MediaPipe hand tracking data into
 * fluid-compatible pointer objects. Used by FluidTest, WatercolorSquares,
 * and Cardinals.
 */
export default function FluidHandsBridge({
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

  useEffect(() => {
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

  useEffect(
    () => () => {
      previousByHandRef.current.clear();
      onPointerChange(null);
    },
    [onPointerChange]
  );

  return null;
}
