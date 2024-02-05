import { folder, useControls } from 'leva';
import React from 'react';
import { UnrealBloomPass } from 'three-stdlib';

import { BakeShadows, Effects, PerspectiveCamera } from '@react-three/drei';
import { extend } from '@react-three/fiber';

import Logo from 'components/elements/logo/Logo';
import CameraRig from 'components/rigging/CameraRig';
import LightingRig from 'components/rigging/LightingRig';

extend({ UnrealBloomPass });

export default function LoGlow() {
  const {
    backgroundColor,
    fogColor,
    fogNear,
    fogFar,
    bloomThreshold,
    bloomStrength,
    bloomRadius,
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
    'LoGlow',
    {
      Background: folder(
        {
          backgroundColor: { label: 'Background Color', value: '#202030' },
          Fog: folder(
            {
              fogColor: { label: 'Fog Color', value: '#202030' },
              fogNear: { label: 'Fog Near', value: 10 },
              fogFar: { label: 'Fog Far', value: 25 },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
      Bloom: folder(
        {
          bloomThreshold: {
            label: 'Bloom Threshold',
            value: 0.1,
            min: 0,
            max: 10,
          },
          bloomStrength: {
            label: 'Bloom Strength',
            value: 0.2,
            min: 0,
            max: 10,
          },
          bloomRadius: { label: 'Bloom Radius', value: 0.2, min: 0, max: 10 },
        },
        { collapsed: true }
      ),
      Logo: folder(
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
              reversalRotation: {
                label: 'Rotation',
                value: { x: 0, y: 0, z: 0 },
              },
              'Inner Color': folder(
                {
                  reversalInnerColor: { label: 'Color', value: '#FF0000' },
                  reversalInnerColorEmissive: {
                    label: 'Emissive',
                    value: true,
                  },
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
                  reversalOuterColorEmissive: {
                    label: 'Emissive',
                    value: false,
                  },
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
      ),
    },
    { collapsed: true }
  );

  return (
    <>
      <LightingRig />
      <CameraRig screenShot />
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <BakeShadows />

      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      <Logo
        scale={2}
        {...{
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
        }}
      />

      <Effects disableGamma>
        <unrealBloomPass
          threshold={bloomThreshold}
          strength={bloomStrength}
          radius={bloomRadius}
        />
      </Effects>
    </>
  );
}
