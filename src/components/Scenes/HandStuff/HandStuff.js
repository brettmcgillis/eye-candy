import { button, useControls } from 'leva';
import React, { useRef } from 'react';

import {
  Environment,
  Grid,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import Reversal from 'components/elements/reversal/Reversal';

import HandLandmarksDebug from './HandLandmarksDebug';
import useHandGestureEvents from './useHandGestureEvents';
import useHandControls from './useHandcontrols';
import useMediaPipeHands from './useMediaPipeHands';

export default function HandStuff() {
  const probe = useRef();
  const leftProbe = useRef();
  const rightProbe = useRef();

  /* ---------------- Leva controls ---------------- */

  const mp = useControls(
    'MediaPipe',
    {
      maxHands: { label: 'Hands', value: 2, min: 1, max: 2, step: 1 },
      showVideo: { label: 'Show Video', value: true },
      showDebugSkeleton: { label: 'Show Skeleton', value: true },
      landmarkColor: { label: 'Landmark Color', value: '#FF3366' },
      connectorColor: { label: 'Connector Color', value: '#00FFAA' },
      landmarkRadius: { label: 'Landmark Radius', value: 4, min: 1, max: 10 },
      connectorLineWidth: {
        label: 'Connector Line Width',
        value: 3,
        min: 1,
        max: 10,
      },
      videoSize: {
        label: 'Video Size (x)',
        value: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
      },
    },
    { collapsed: true }
  );

  const mapping = useControls(
    'Scale Mapping',
    {
      xScale: { label: 'X', value: 4, min: 1, max: 10, step: 0.1 },
      yScale: { label: 'Y', value: 3, min: 1, max: 10, step: 0.1 },
      zScale: { label: 'Z', value: 5, min: 1, max: 15, step: 0.1 },
    },
    { collapsed: true }
  );

  const debug = useControls(
    'Debug',
    {
      showLandmarks: { label: 'Show Landmarks', value: true },
      reset: button(() => {
        probe.current.position.set(0, 0, 1);
        leftProbe.current.position.set(-1, 0, 1);
        rightProbe.current.position.set(1, 0, 1);
      }),
    },
    { collapsed: true }
  );

  /* ---------------- Hooks pipeline ---------------- */

  const results = useMediaPipeHands({
    maxHands: mp.maxHands,
    showVideo: mp.showVideo,
    showDebugSkeleton: mp.showDebugSkeleton,
    landmarkStyle: { color: mp.landmarkColor, radius: mp.landmarkRadius },
    connectorStyle: {
      color: mp.connectorColor,
      lineWidth: mp.connectorLineWidth,
    },
    videoSize: mp.videoSize,
  });

  const hands = useHandControls(results, {
    maxHands: mp.maxHands,
    ...mapping,
  });

  const gestureState = useHandGestureEvents(hands, {
    onGestureStart: (g) => console.log('👉 gesture start:', g),
    onGestureEnd: (g) => console.log('👋 gesture end:', g),

    onLeftGestureStart: (g) => console.log('✋ left start:', g),
    onRightGestureStart: (g) => console.log('🤚 right start:', g),

    onLeftFingerPinchStart: (f) => console.log('🤏 LEFT PINCH:', f),
    onRightFingerPinchStart: (f) => console.log('🤏 RIGHT PINCH:', f),

    onSwipeLeft: () => console.log('⬅️ swipe left'),
    onSwipeRight: () => console.log('➡️ swipe right'),
  });

  /* ---------------- Example interaction ---------------- */

  useFrame(() => {
    if (hands?.handPosition && probe.current) {
      probe.current.position.lerp(hands.handPosition, 0.25);
    }
    if (hands?.leftHandPosition && leftProbe.current) {
      leftProbe.current.position.lerp(hands.leftHandPosition, 0.25);
    }
    if (hands?.rightHandPosition && rightProbe.current) {
      rightProbe.current.position.lerp(hands.rightHandPosition, 0.25);
    }
  });

  /* ---------------- Visual gesture feedback ---------------- */

  function poseColor(pose) {
    if (!pose) return 'white';

    switch (pose) {
      /* base poses */
      case 'PALM_OPEN':
        return 'deepskyblue';
      case 'GRAB':
        return 'red';
      case 'POINT':
        return 'yellow';
      case 'VICTORY':
        return 'lime';
      case 'THE_HORNS':
        return 'orange';

      /* generic pinch */
      case 'PINCH':
        return 'hotpink';

      /* individual finger pinches */
      case 'THUMB_INDEX':
        return 'hotpink';
      case 'THUMB_MIDDLE':
        return 'violet';
      case 'THUMB_RING':
        return 'cyan';
      case 'THUMB_PINKY':
        return 'gold';

      default:
        return 'white';
    }
  }

  return (
    <>
      <Environment preset="sunset" />
      <PerspectiveCamera makeDefault position={[-5, 2, 4]} fov={50} />

      <ambientLight intensity={0.5} />
      <color attach="background" args={['#5b5b5b']} />

      <OrbitControls />
      <Grid args={[10, 10]} />
      <Reversal />

      {/* primary hand */}
      <mesh ref={probe} position={[0, 0, 1]} visible={mp.maxHands === 1}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial color={poseColor(gestureState?.primaryPose)} />
      </mesh>

      {/* left hand */}
      <mesh ref={leftProbe} position={[-1, 0, 1]} visible={mp.maxHands === 2}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial color={poseColor(gestureState?.leftPose)} />
      </mesh>

      {/* right hand */}
      <mesh ref={rightProbe} position={[1, 0, 1]} visible={mp.maxHands === 2}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial color={poseColor(gestureState?.rightPose)} />
      </mesh>

      {/* landmark debug */}
      {debug.showLandmarks && hands && (
        <HandLandmarksDebug hands={hands.hands} scale={mapping} />
      )}
    </>
  );
}
