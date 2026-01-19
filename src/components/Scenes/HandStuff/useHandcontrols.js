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

/* -------- stable palm reference -------- */

function palmCenter(lm) {
  const pts = [lm.wrist, lm.indexMCP, lm.middleMCP, lm.ringMCP, lm.pinkyMCP];

  const out = { x: 0, y: 0, z: 0 };

  pts.forEach((p) => {
    out.x += p.x;
    out.y += p.y;
    out.z += p.z;
  });

  out.x /= pts.length;
  out.y /= pts.length;
  out.z /= pts.length;

  return out;
}

function palmSize(lm) {
  return dist(lm.indexMCP, lm.pinkyMCP);
}

/* -------- single world-space mapper (mirrored) -------- */

export function mapToWorld(p, { xScale = 4, yScale = 3, zScale = 5 } = {}) {
  return new THREE.Vector3(
    -(p.x - 0.5) * xScale, // mirror X
    -(p.y - 0.5) * yScale,
    -p.z * zScale
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

  left: null,
  right: null,
  primary: null,

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

    /* -------- build hand objects -------- */

    const hands = results.multiHandLandmarks.map((lm, i) => {
      const named = nameLandmarks(lm);
      const palm = palmCenter(named);

      const position = mapToWorld(palm, { xScale, yScale, zScale });

      return {
        index: i,
        landmarks: named,
        rawLandmarks: lm,
        palm,
        position,
        gestures: computeGestures(named, {
          pinchThreshold,
          closeThreshold,
          expandThreshold,
        }),
      };
    });

    /* -------- assign left/right by world X -------- */

    const sorted = [...hands].sort((a, b) => a.position.x - b.position.x);

    const left = sorted[0] ?? null;
    const right = sorted[1] ?? null;

    const primary = maxHands === 1 ? hands[0] ?? null : null;

    /* -------- return unified state -------- */

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
