import { folder, useControls } from 'leva';
import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import Bret from 'components/elements/bret/Bret';
import Reversal from 'components/elements/reversal/Reversal';

import { radians } from 'utils/math';

function sineWave(time, speed, intensity) {
  return Math.sin(time * speed) * intensity;
}

function waitAndFlip(time, waitPeriod, rotationPeriod) {
  const cycleTime = time % (waitPeriod + rotationPeriod);
  if (cycleTime < waitPeriod) {
    return 0;
  }
  const rotationTime = cycleTime - waitPeriod;
  const rotationProgress = rotationTime / rotationPeriod;
  const rotationAngle = rotationProgress * 2 * Math.PI;
  return rotationAngle;
}

export default function Logo({
  bretPosition = { x: 0, y: 0, z: 0 },
  bretRotation = { x: 0, y: 0, z: 0 },
  bretInnerColor = '#FF0000',
  bretInnerColorEmissive = false,
  bretInnerColorEmissiveIntensity = 0,
  bretOuterColor = '#000000',
  bretOuterColorEmissive = false,
  bretOuterColorEmissiveIntensity = 0,
  reversalPosition = { x: 0.9, y: -0.4, z: 0 },
  reversalRotation = { x: 0, y: 0, z: 0 },
  reversalInnerColor = '#FF0000',
  reversalInnerColorEmissive = false,
  reversalInnerColorEmissiveIntensity = 0,
  reversalOuterColor = '#000000',
  reversalOuterColorEmissive = false,
  reversalOuterColorEmissiveIntensity = 0,
  ...props
}) {
  const {
    float,
    floatSpeed,
    floatIntensity,
    flip,
    flipDelay,
    flipDuration,
    spin,
    spinRotation,
    spinSpeed,
  } = useControls(
    'Logo',
    {
      Float: folder(
        {
          float: { label: 'Float', value: false },
          floatSpeed: {
            label: 'Speed',
            value: 1,
            min: 0,
            max: 10,
            step: 0.01,
          },
          floatIntensity: {
            label: 'Intensity',
            value: 0.05,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Spin: folder(
        {
          spin: { label: 'Spin', value: false },
          spinRotation: {
            label: 'Rotation',
            value: 33,
            min: 0,
            max: 360,
            step: 1,
          },
          spinSpeed: { label: 'Speed', value: 0.4, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true }
      ),
      Flip: folder(
        {
          flip: { label: 'Flip', value: false },
          flipDuration: {
            label: 'Duration',
            value: 2,
            min: 1,
            max: 2,
            step: 0.01,
          },
          flipDelay: {
            label: 'Delay',
            value: 4,
            min: 0,
            max: 10,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const logoRef = useRef();
  const bretRef = useRef();
  const reversalRef = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (float) {
      logoRef.current.position.y = sineWave(time, floatSpeed, floatIntensity);
    } else if (logoRef.current.position.y !== 0) {
      logoRef.current.position.y = sineWave(
        time,
        floatSpeed * 2,
        floatIntensity
      );
      if (Math.abs(logoRef.current.position.y) < 0.01) {
        logoRef.current.position.y = 0;
      }
    }
    if (spin) {
      logoRef.current.rotation.y = radians(
        sineWave(time, spinSpeed, spinRotation)
      );
    } else if (logoRef.current.rotation.y !== 0) {
      logoRef.current.rotation.y = radians(
        sineWave(time, spinSpeed * 2, spinRotation)
      );
      if (Math.abs(logoRef.current.rotation.y) < 0.1) {
        logoRef.current.rotation.y = 0;
      }
    }
    if (flip || reversalRef.current.rotation.x !== 0) {
      reversalRef.current.rotation.x = waitAndFlip(
        time,
        flipDelay,
        flipDuration
      );
    }
  });

  return (
    <group {...props} dispose={null}>
      <group ref={logoRef}>
        <group
          position={[bretPosition.x, bretPosition.y, bretPosition.z]}
          rotation={[
            radians(bretRotation.x),
            radians(bretRotation.y),
            radians(bretRotation.z),
          ]}
        >
          <group ref={bretRef}>
            <Bret
              innerColor={bretInnerColor}
              innerColorEmissive={bretInnerColorEmissive}
              innerColorEmissiveIntensity={bretInnerColorEmissiveIntensity}
              outerColor={bretOuterColor}
              outerColorEmissive={bretOuterColorEmissive}
              outerColorEmissiveIntensity={bretOuterColorEmissiveIntensity}
            />
          </group>
        </group>
        <group
          position={[
            reversalPosition.x,
            reversalPosition.y,
            reversalPosition.z,
          ]}
          rotation={[
            radians(reversalRotation.x),
            radians(reversalRotation.y),
            radians(reversalRotation.z),
          ]}
        >
          <group ref={reversalRef}>
            <Reversal
              innerColor={reversalInnerColor}
              innerColorEmissive={reversalInnerColorEmissive}
              innerColorEmissiveIntensity={reversalInnerColorEmissiveIntensity}
              outerColor={reversalOuterColor}
              outerColorEmissive={reversalOuterColorEmissive}
              outerColorEmissiveIntensity={reversalOuterColorEmissiveIntensity}
            />
          </group>
        </group>
      </group>
    </group>
  );
}
