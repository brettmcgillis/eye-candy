import { useEffect, useMemo, useRef } from 'react';

/* ---------------------------------------------
 Math helpers
----------------------------------------------*/

function dist2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isExtended(lm, tip, pip) {
  const t = lm[tip];
  const p = lm[pip];
  const w = lm[0];
  return dist2D(t, w) > dist2D(p, w);
}

/* ---------------------------------------------
 Finger pinches (low-level)
----------------------------------------------*/

function detectFingerPinches(lm, threshold = 0.045) {
  if (!lm) return null;

  const thumb = lm[4];

  return {
    index: dist2D(thumb, lm[8]) < threshold,
    middle: dist2D(thumb, lm[12]) < threshold,
    ring: dist2D(thumb, lm[16]) < threshold,
    pinky: dist2D(thumb, lm[20]) < threshold,
  };
}

/* ---------------------------------------------
 Pose classification (high-level)
----------------------------------------------*/

function detectPose(lm, { pinchDist = 0.05 } = {}) {
  if (!lm) return 'IDLE';

  const thumb = lm[4];
  const index = lm[8];

  const indexExt = isExtended(lm, 8, 6);
  const middleExt = isExtended(lm, 12, 10);
  const ringExt = isExtended(lm, 16, 14);
  const pinkyExt = isExtended(lm, 20, 18);

  const pinch = dist2D(thumb, index) < pinchDist;

  /* ---------- priority ordering ---------- */

  if (pinch) return 'PINCH';

  if (!indexExt && middleExt && !ringExt && !pinkyExt) return 'THE_BIRD';

  if (indexExt && !middleExt && !ringExt && pinkyExt) return 'THE_HORNS';

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
    fingerPinchDist = 0.045,

    swipeThreshold = 0.12,
    swipeCooldownMs = 900,

    onLeftGestureStart,
    onLeftGestureEnd,
    onRightGestureStart,
    onRightGestureEnd,
    onGestureStart,
    onGestureEnd,

    onLeftFingerPinchStart,
    onLeftFingerPinchEnd,
    onRightFingerPinchStart,
    onRightFingerPinchEnd,

    onSwipeLeft,
    onSwipeRight,
  } = {}
) {
  const prev = useRef({
    leftGesture: 'IDLE',
    rightGesture: 'IDLE',
    primaryGesture: 'IDLE',
    leftPinches: {},
    rightPinches: {},
  });

  const prevHandPos = useRef(null);
  const swipeCooldown = useRef(0);

  /* ---------------------------------------------
   Build gesture state
  ----------------------------------------------*/

  const gestureState = useMemo(() => {
    if (!handState?.hands?.length) return null;

    const build = (hand) => {
      if (!hand) return null;

      const lm = hand.rawLandmarks;

      return {
        pose: detectPose(lm, { pinchDist }),
        pinches: detectFingerPinches(lm, fingerPinchDist),
      };
    };

    const left = build(handState.left);
    const right = build(handState.right);
    const primary = build(handState.primary);

    return {
      left,
      right,
      primary,

      leftPose: left?.pose ?? 'IDLE',
      rightPose: right?.pose ?? 'IDLE',
      primaryPose: primary?.pose ?? 'IDLE',
    };
  }, [handState, pinchDist, fingerPinchDist]);

  /* ---------------------------------------------
   Pose edge events
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
      gestureState.leftPose,
      onLeftGestureStart,
      onLeftGestureEnd
    );

    edge(
      'rightGesture',
      gestureState.rightPose,
      onRightGestureStart,
      onRightGestureEnd
    );

    edge(
      'primaryGesture',
      gestureState.primaryPose,
      onGestureStart,
      onGestureEnd
    );
  }, [gestureState, handState]);

  /* ---------------------------------------------
   Finger pinch edge events
  ----------------------------------------------*/

  useEffect(() => {
    if (!gestureState) return;

    function detectPinches(handKey, current, onStart, onEnd) {
      const prevMap = prev.current[handKey] || {};
      if (!current) return;

      ['index', 'middle', 'ring', 'pinky'].forEach((finger) => {
        const now = current[finger];
        const was = prevMap[finger] ?? false;

        if (!was && now && onStart) onStart(finger, handState);
        if (was && !now && onEnd) onEnd(finger, handState);

        prevMap[finger] = now;
      });

      prev.current[handKey] = prevMap;
    }

    detectPinches(
      'leftPinches',
      gestureState.left?.pinches,
      onLeftFingerPinchStart,
      onLeftFingerPinchEnd
    );

    detectPinches(
      'rightPinches',
      gestureState.right?.pinches,
      onRightFingerPinchStart,
      onRightFingerPinchEnd
    );
  }, [gestureState, handState]);

  /* ---------------------------------------------
   Swipe detection
  ----------------------------------------------*/

  useEffect(() => {
    if (!gestureState || !handState) return;

    const now = Date.now();

    const activeHand = handState.right || handState.left;
    const activePose = handState.right
      ? gestureState.rightPose
      : gestureState.leftPose;

    if (!activeHand || activePose !== 'PALM_OPEN') {
      prevHandPos.current = null;
      return;
    }

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

    left: gestureState?.left,
    right: gestureState?.right,
    primary: gestureState?.primary,

    isPalmOpen:
      gestureState?.leftPose === 'PALM_OPEN' ||
      gestureState?.rightPose === 'PALM_OPEN',

    isGrabbing:
      gestureState?.leftPose === 'GRAB' || gestureState?.rightPose === 'GRAB',

    isBird:
      gestureState?.leftPose === 'THE_BIRD' ||
      gestureState?.rightPose === 'THE_BIRD',

    isHorns:
      gestureState?.leftPose === 'THE_HORNS' ||
      gestureState?.rightPose === 'THE_HORNS',
  };
}
