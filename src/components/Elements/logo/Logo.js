import { folder, useControls } from 'leva';
import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import Bret from 'components/elements/bret/Bret';
import Reversal from 'components/elements/reversal/Reversal';

import { radians } from 'utils/math';

function getPosition(time, speed, intensity) {
  return Math.sin(time * speed) * intensity;
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
    // flip,
    // flipDelay,
    // flipSpeed,
    // flipRotation,
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
      //   Flip: folder(
      //     {
      //       flip: { label: 'Flip', value: false },
      //       flipRotation: {
      //         label: 'Rotation',
      //         value: 360,
      //         min: 0,
      //         max: 360,
      //         step: 1,
      //       },
      //       flipSpeed: { label: 'Speed', value: 0.1, min: 0, max: 1, step: 0.01 },
      //       flipDelay: { label: 'Delay', value: 0, min: 0, max: 10, step: 0.01 },
      //     },
      //     { collapsed: true }
      //   ),
    },
    { collapsed: true }
  );

  const logoRef = useRef();
  const bretRef = useRef();
  const reversalRef = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (float) {
      logoRef.current.position.y = getPosition(
        time,
        floatSpeed,
        floatIntensity
      );
    } else {
      logoRef.current.position.y = 0;
    }
    if (spin) {
      logoRef.current.rotation.y = radians(
        getPosition(time, spinSpeed, spinRotation)
      );
    } else {
      logoRef.current.rotation.y = 0;
    }
    // if (flip) {
    //   reversalRef.current.rotation.x = radians(
    //     getPosition(time, flipSpeed, flipRotation)
    //   );
    // }
  });

  return (
    <group {...props} dispose={null}>
      <group ref={logoRef}>
        <group ref={bretRef}>
          <Bret
            position={[bretPosition.x, bretPosition.y, bretPosition.z]}
            rotation={[
              radians(bretRotation.x),
              radians(bretRotation.y),
              radians(bretRotation.z),
            ]}
            innerColor={bretInnerColor}
            innerColorEmissive={bretInnerColorEmissive}
            innerColorEmissiveIntensity={bretInnerColorEmissiveIntensity}
            outerColor={bretOuterColor}
            outerColorEmissive={bretOuterColorEmissive}
            outerColorEmissiveIntensity={bretOuterColorEmissiveIntensity}
          />
        </group>
        <group ref={reversalRef}>
          <Reversal
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
  );
}
