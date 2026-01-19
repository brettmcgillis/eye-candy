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

/* ---------------------------------------------
 Stable palm reference
----------------------------------------------*/

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

/* ---------------------------------------------
 World mapping (single source of truth)
----------------------------------------------*/

export function mapToWorld(p, { xScale = 4, yScale = 3, zScale = 5 } = {}) {
  return new THREE.Vector3(
    (0.5 - p.x) * xScale,
    (0.5 - p.y) * yScale,
    -p.z * zScale
  );
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
};

/* ---------------------------------------------
 Main hook
----------------------------------------------*/

export default function useHandControls(
  results,
  { maxHands = 1, xScale = 4, yScale = 3, zScale = 5 } = {}
) {
  return useMemo(() => {
    if (!results?.multiHandLandmarks?.length) {
      return emptyState;
    }

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
      };
    });

    const sorted = [...hands].sort((a, b) => a.position.x - b.position.x);

    const left = sorted[0] ?? null;
    const right = sorted[1] ?? null;
    const primary = maxHands === 1 ? hands[0] ?? null : null;

    return {
      hands,
      left,
      right,
      primary,

      leftHandPosition: left?.position ?? null,
      rightHandPosition: right?.position ?? null,
      handPosition: primary?.position ?? null,

      leftHandLandmarks: left?.landmarks ?? null,
      rightHandLandmarks: right?.landmarks ?? null,
      landmarks: primary?.landmarks ?? null,
    };
  }, [results, maxHands, xScale, yScale, zScale]);
}
