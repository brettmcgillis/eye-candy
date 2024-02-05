import React from 'react';

import Bret from 'components/elements/bret/Bret';
import Reversal from 'components/elements/reversal/Reversal';

import { radians } from 'utils/math';

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
  return (
    <group {...props} dispose={null}>
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
      <Reversal
        position={[reversalPosition.x, reversalPosition.y, reversalPosition.z]}
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
  );
}
