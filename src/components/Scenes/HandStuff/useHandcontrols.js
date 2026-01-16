// useHandControls.js
import { useMemo } from 'react';
import * as THREE from 'three';

/* ---------------------------------------------
 Landmark naming map (MediaPipe index → label)
----------------------------------------------*/

const LANDMARK_NAMES = [
  'wrist',

  'thumbCMC',
  'thumbMCP',
  'thumbIP',
  'thumbTip',

  'indexMCP',
  'indexPIP',
  'indexDIP',
  'indexTip',

  'middleMCP',
  'middlePIP',
  'middleDIP',
  'middleTip',

  'ringMCP',
  'ringPIP',
  'ringDIP',
  'ringTip',

  'pinkyMCP',
  'pinkyPIP',
  'pinkyDIP',
  'pinkyTip',
];

/* ---------------------------------------------
 Helpers
----------------------------------------------*/

function nameLandmarks(landmarks) {
  if (!landmarks) return null;

  const named = {};
  LANDMARK_NAMES.forEach((name, i) => {
    named[name] = landmarks[i];
  });

  return named;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function palmSize(lm) {
  return dist(lm.wrist, lm.middleMCP);
}

function toWorldPosition(wrist, { xScale = 4, yScale = 3, zScale = 5 } = {}) {
  return new THREE.Vector3(
    (wrist.x - 0.5) * xScale,
    -(wrist.y - 0.5) * yScale,
    -wrist.z * zScale
  );
}

/* ---------------------------------------------
 Gesture extraction
----------------------------------------------*/

function computeGestures(
  lm,
  { pinchThreshold = 0.35, closeThreshold = 1.1, expandThreshold = 1.6 } = {}
) {
  if (!lm) return null;

  const size = palmSize(lm);

  const pinch = dist(lm.thumbTip, lm.indexTip) / size < pinchThreshold;

  const closed = dist(lm.middleTip, lm.wrist) / size < closeThreshold;

  const expanded = dist(lm.indexTip, lm.pinkyTip) / size > expandThreshold;

  return { pinch, closed, expanded };
}

/* ---------------------------------------------
 Empty fallback
----------------------------------------------*/

const emptyState = {
  hands: [],

  leftHandPosition: null,
  rightHandPosition: null,
  handPosition: null,

  leftHandLandmarks: null,
  rightHandLandmarks: null,
  landmarks: null,

  leftPinch: false,
  rightPinch: false,
  pinch: false,

  leftClosed: false,
  rightClosed: false,
  closed: false,

  leftExpanded: false,
  rightExpanded: false,
  expanded: false,
};

/* ---------------------------------------------
 Main hook
----------------------------------------------*/

export default function useHandControls(
  results,
  {
    maxHands = 1,

    // gesture tuning
    pinchThreshold = 0.35,
    closeThreshold = 1.1,
    expandThreshold = 1.6,

    // world mapping
    xScale = 4,
    yScale = 3,
    zScale = 5,
  } = {}
) {
  return useMemo(() => {
    if (!results?.multiHandLandmarks?.length) {
      return emptyState;
    }

    const hands = results.multiHandLandmarks.map((lm, i) => {
      const named = nameLandmarks(lm);
      const handedness = results.multiHandedness?.[i]?.label || 'Unknown';

      return {
        handedness,
        landmarks: named,
        rawLandmarks: lm,
        position: toWorldPosition(named.wrist, { xScale, yScale, zScale }),
        gestures: computeGestures(named, {
          pinchThreshold,
          closeThreshold,
          expandThreshold,
        }),
      };
    });

    let left = null;
    let right = null;

    hands.forEach((hand) => {
      if (hand.handedness === 'Left') left = hand;
      if (hand.handedness === 'Right') right = hand;
    });

    const primary = maxHands === 1 ? hands[0] ?? null : null;

    return {
      hands,
      left,
      right,
      primary,

      /* -------- positions -------- */
      leftHandPosition: left?.position ?? null,
      rightHandPosition: right?.position ?? null,
      handPosition: primary?.position ?? null,

      /* -------- landmarks -------- */
      leftHandLandmarks: left?.landmarks ?? null,
      rightHandLandmarks: right?.landmarks ?? null,
      landmarks: primary?.landmarks ?? null,

      /* -------- gestures -------- */
      leftPinch: left?.gestures.pinch ?? false,
      rightPinch: right?.gestures.pinch ?? false,
      pinch: primary?.gestures.pinch ?? false,

      leftClosed: left?.gestures.closed ?? false,
      rightClosed: right?.gestures.closed ?? false,
      closed: primary?.gestures.closed ?? false,

      leftExpanded: left?.gestures.expanded ?? false,
      rightExpanded: right?.gestures.expanded ?? false,
      expanded: primary?.gestures.expanded ?? false,
    };
  }, [
    results,
    maxHands,
    pinchThreshold,
    closeThreshold,
    expandThreshold,
    xScale,
    yScale,
    zScale,
  ]);
}
