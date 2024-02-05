import { folder, useControls } from 'leva';
import React from 'react';
import { UnrealBloomPass } from 'three-stdlib';

import {
  BakeShadows,
  Effects,
  Float,
  PerspectiveCamera,
} from '@react-three/drei';
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
    innerColorVal,
    innerColorEmissive,
    innerColorEmissiveIntensity,
    outerColorVal,
    outerColorEmissive,
    outerColorEmissiveIntensity,
    floatSpeed,
    floatRotationIntensity,
    floatIntensity,
    floatingRangeMin,
    floatingRangeMax,
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
      Colors: folder(
        {
          innerColorVal: {
            label: 'Inner Color',
            value: '#FF0000',
          },
          innerColorEmissive: {
            label: 'Inner Color Emissive',
            value: true,
          },
          innerColorEmissiveIntensity: {
            label: 'Inner Color Emissive Intensity',
            value: 5,
            min: 0,
            max: 10,
          },
          outerColorVal: {
            label: 'Outer Color',
            value: '#000000',
          },
          outerColorEmissive: {
            label: 'Outer Color Emissive',
            value: false,
          },
          outerColorEmissiveIntensity: {
            label: 'Outer Color Emissive Intensity',
            value: 0,
            min: 0,
            max: 10,
          },
        },
        { collapsed: true }
      ),
      Float: folder(
        {
          floatSpeed: {
            label: 'Float Speed',
            value: 5,
            min: 0,
            max: 10,
            step: 1,
          },
          floatRotationIntensity: {
            label: 'Float Rotation Intensity',
            value: 0,
            min: 0,
            max: 10,
            step: 1,
          },
          floatIntensity: {
            label: 'Float Intensity',
            value: 0.1,
            min: 0,
            max: 10,
            step: 0.1,
          },
          floatingRangeMin: {
            label: 'Floating Range (Min)',
            value: -1,
            min: -10,
            max: 0,
            step: 0.1,
          },
          floatingRangeMax: {
            label: 'Floating Range (Max)',
            value: 1,
            min: 0,
            max: 10,
            step: 0.1,
          },
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

      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      <Float
        speed={floatSpeed}
        rotationIntensity={floatRotationIntensity}
        floatIntensity={floatIntensity}
        floatingRange={[floatingRangeMin, floatingRangeMax]}
      >
        <Logo
          innerColorVal={innerColorVal}
          innerColorEmissive={innerColorEmissive}
          innerColorEmissiveIntensity={innerColorEmissiveIntensity}
          outerColorVal={outerColorVal}
          outerColorEmissive={outerColorEmissive}
          outerColorEmissiveIntensity={outerColorEmissiveIntensity}
          scale={2}
        />
      </Float>
      <BakeShadows />
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
