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
      maxHands: { label: 'Hands', value: 1, min: 1, max: 2, step: 1 },
      showVideo: { label: 'Show Video', value: false },
    },
    { collapsed: true }
  );

  const gestures = useControls(
    'Gestures',
    {
      pinchThreshold: {
        label: 'Pinch Threshold',
        value: 0.17,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      closeThreshold: {
        label: 'Close Threshold',
        value: 1.15,
        min: 0.4,
        max: 2,
        step: 0.05,
      },
      expandThreshold: {
        label: 'Expand Threshold',
        value: 0.9,
        min: 0.8,
        max: 3,
        step: 0.05,
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
      showLandmarks: { label: 'Show Landmarks', value: false },
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
  });

  const hands = useHandControls(results, {
    maxHands: mp.maxHands,
    ...gestures,
    ...mapping,
  });

  useHandGestureEvents(hands, {
    onPinchStart: () => console.log('🤏 pinch 🤏'),
    onCloseStart: () => console.log('✊ close ✊'),
    onExpandStart: () => console.log('🖐 expand 🖐 '),

    onLeftPinchStart: () => console.log('🤏 pinch left'),
    onLeftCloseStart: () => console.log('✊ close left'),
    onLeftExpandStart: () => console.log('🖐 expand left'),

    onRightPinchStart: () => console.log('🤏 pinch right'),
    onRightCloseStart: () => console.log('✊ close right'),
    onRightExpandStart: () => console.log('🖐 expand right'),
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

  /* ---------------- LFG MY DUDES  ---------------- */
  const probeColor = (hand) => {
    if (hand?.gestures?.pinch) return 'hotpink';
    if (hand?.gestures?.closed) return 'red';
    if (hand?.gestures?.expanded) return 'blue';
    return 'white';
  };

  return (
    <>
      <Environment preset="sunset" />

      <PerspectiveCamera makeDefault position={[-5, 2, 4]} fov={50} />

      <ambientLight intensity={0.5} />
      <color attach="background" args={['#5b5b5b']} />

      <OrbitControls />
      <Grid args={[10, 10]} />

      <Reversal />

      {/* test objects driven by hand */}
      <mesh ref={probe} position={[0, 0, 1]} visible={mp.maxHands === 1}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial color={probeColor(hands.primary)} />
      </mesh>

      <mesh ref={leftProbe} position={[-1, 0, 1]} visible={mp.maxHands === 2}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial color={probeColor(hands.left)} />
      </mesh>

      <mesh ref={rightProbe} position={[1, 0, 1]} visible={mp.maxHands === 2}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial color={probeColor(hands.right)} />
      </mesh>

      {/* landmark debug */}
      {debug.showLandmarks && hands && (
        <HandLandmarksDebug hands={hands.hands} scale={mapping} />
      )}
    </>
  );
}
