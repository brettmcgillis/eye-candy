import { useEffect, useMemo, useRef } from 'react';

/* ---------------------------------------------
 Math helpers
----------------------------------------------*/

function dist2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isExtended(lm, tipIndex, pipIndex) {
  const tip = lm[tipIndex];
  const pip = lm[pipIndex];
  const wrist = lm[0];

  return dist2D(tip, wrist) > dist2D(pip, wrist);
}

/* ---------------------------------------------
 Pose classification
----------------------------------------------*/

function detectPose(landmarks, { pinchDist = 0.05 } = {}) {
  if (!landmarks) return 'IDLE';

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const indexExt = isExtended(landmarks, 8, 6);
  const middleExt = isExtended(landmarks, 12, 10);
  const ringExt = isExtended(landmarks, 16, 14);
  const pinkyExt = isExtended(landmarks, 20, 18);

  const pinch = dist2D(thumbTip, indexTip) < pinchDist;

  /* ---------- high confidence gestures first ---------- */

  if (pinch) return 'PINCH';

  // 🖕 THE BIRD
  if (!indexExt && middleExt && !ringExt && !pinkyExt) return 'THE_BIRD';

  if (indexExt && middleExt && ringExt && pinkyExt) return 'PALM_OPEN';

  if (!indexExt && !middleExt && !ringExt && !pinkyExt) return 'GRAB';

  if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'POINT';

  if (indexExt && middleExt && !ringExt && !pinkyExt) return 'VICTORY';

  return 'IDLE';
}

/* ---------------------------------------------
 Main hook
----------------------------------------------*/

export default function useHandGestureEvents(
  handState,
  {
    pinchDist = 0.05,
    swipeThreshold = 0.12,
    swipeCooldownMs = 900,

    onLeftGestureStart,
    onLeftGestureEnd,
    onRightGestureStart,
    onRightGestureEnd,
    onGestureStart,
    onGestureEnd,

    onSwipeLeft,
    onSwipeRight,
  } = {}
) {
  const prev = useRef({
    leftGesture: 'IDLE',
    rightGesture: 'IDLE',
    primaryGesture: 'IDLE',
  });

  const prevHandPos = useRef(null);
  const swipeCooldown = useRef(0);

  /* ---------------------------------------------
   Build gesture state
  ----------------------------------------------*/

  const gestureState = useMemo(() => {
    if (!handState?.hands?.length) return null;

    const leftPose = handState.left
      ? detectPose(handState.left.rawLandmarks, { pinchDist })
      : 'IDLE';

    const rightPose = handState.right
      ? detectPose(handState.right.rawLandmarks, { pinchDist })
      : 'IDLE';

    const primaryPose = handState.primary
      ? detectPose(handState.primary.rawLandmarks, { pinchDist })
      : 'IDLE';

    return {
      left: leftPose,
      right: rightPose,
      primary: primaryPose,
    };
  }, [handState, pinchDist]);

  /* ---------------------------------------------
   Edge events
  ----------------------------------------------*/

  useEffect(() => {
    if (!gestureState) return;

    function edge(key, current, onStart, onEnd) {
      const prevVal = prev.current[key];

      if (prevVal !== current) {
        if (current !== 'IDLE' && onStart) onStart(current, handState);
        if (prevVal !== 'IDLE' && onEnd) onEnd(prevVal, handState);
        prev.current[key] = current;
      }
    }

    edge(
      'leftGesture',
      gestureState.left,
      onLeftGestureStart,
      onLeftGestureEnd
    );

    edge(
      'rightGesture',
      gestureState.right,
      onRightGestureStart,
      onRightGestureEnd
    );

    edge('primaryGesture', gestureState.primary, onGestureStart, onGestureEnd);
  }, [gestureState, handState]);

  /* ---------------------------------------------
   Swipe detection
  ----------------------------------------------*/

  useEffect(() => {
    if (!gestureState || !handState) return;

    const now = Date.now();

    const activeHand = handState.right || handState.left;
    const activePose = handState.right ? gestureState.right : gestureState.left;

    if (!activeHand || activePose !== 'PALM_OPEN') {
      prevHandPos.current = null;
      return;
    }

    // middle MCP
    const p = activeHand.rawLandmarks[9];
    const curr = { x: p.x, y: p.y };

    if (prevHandPos.current) {
      const dx = curr.x - prevHandPos.current.x;

      if (
        Math.abs(dx) > swipeThreshold &&
        now - swipeCooldown.current > swipeCooldownMs
      ) {
        if (dx > 0 && onSwipeRight) onSwipeRight(handState);
        if (dx < 0 && onSwipeLeft) onSwipeLeft(handState);

        swipeCooldown.current = now;
      }
    }

    prevHandPos.current = curr;
  }, [gestureState, handState]);

  /* ---------------------------------------------
   Public API
  ----------------------------------------------*/

  return {
    ...gestureState,

    isLeftPinching: gestureState?.left === 'PINCH',
    isRightPinching: gestureState?.right === 'PINCH',
    isGrabbing: gestureState?.left === 'GRAB' || gestureState?.right === 'GRAB',

    isPalmOpen:
      gestureState?.left === 'PALM_OPEN' || gestureState?.right === 'PALM_OPEN',

    isBird:
      gestureState?.left === 'THE_BIRD' || gestureState?.right === 'THE_BIRD',
  };
}
