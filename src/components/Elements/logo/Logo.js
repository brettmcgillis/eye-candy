import { folder, useControls } from 'leva';
import React from 'react';

import Bret from 'components/elements/bret/Bret';
import Reversal from 'components/elements/reversal/Reversal';
import { GridHelper } from 'components/rigging/GridHelper';

import { radians } from 'utils/math';

export default function Logo({ ...props }) {
  const {
    bretPosition,
    bretRotation,
    bretInnerColor,
    bretInnerColorEmissive,
    bretInnerColorEmissiveIntensity,
    bretOuterColor,
    bretOuterColorEmissive,
    bretOuterColorEmissiveIntensity,
    reversalPosition,
    reversalRotation,
    reversalInnerColor,
    reversalInnerColorEmissive,
    reversalInnerColorEmissiveIntensity,
    reversalOuterColor,
    reversalOuterColorEmissive,
    reversalOuterColorEmissiveIntensity,
  } = useControls(
    'Logo',
    {
      Bret: folder(
        {
          bretPosition: { label: 'Position', value: { x: 0, y: 0, z: 0 } },
          bretRotation: { label: 'Rotation', value: { x: 0, y: 0, z: 0 } },
          'Inner Color': folder(
            {
              bretInnerColor: { label: 'Color', value: '#FF0000' },
              bretInnerColorEmissive: { label: 'Emissive', value: true },
              bretInnerColorEmissiveIntensity: {
                label: 'Emissive Intensity',
                value: 5,
                min: 0,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
          'Outer Color': folder(
            {
              bretOuterColor: { label: 'Color', value: '#000000' },
              bretOuterColorEmissive: { label: 'Emissive', value: false },
              bretOuterColorEmissiveIntensity: {
                label: 'Emissive Intensity',
                value: 0,
                min: 0,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
      Reversal: folder(
        {
          reversalPosition: {
            label: 'Position',
            value: { x: 0.9, y: -0.4, z: 0 },
          },
          reversalRotation: { label: 'Rotation', value: { x: 0, y: 0, z: 0 } },
          'Inner Color': folder(
            {
              reversalInnerColor: { label: 'Color', value: '#FF0000' },
              reversalInnerColorEmissive: { label: 'Emissive', value: true },
              reversalInnerColorEmissiveIntensity: {
                label: 'Emissive Intensity',
                value: 5,
                min: 0,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
          'Outer Color': folder(
            {
              reversalOuterColor: { label: 'Color', value: '#000000' },
              reversalOuterColorEmissive: { label: 'Emissive', value: false },
              reversalOuterColorEmissiveIntensity: {
                label: 'Emissive Intensity',
                value: 0,
                min: 0,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  return (
    <group {...props} dispose={null}>
      <GridHelper x y z />
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
