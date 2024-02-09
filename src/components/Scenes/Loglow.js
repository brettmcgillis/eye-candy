import { folder, useControls } from 'leva';
import React, { useState } from 'react';
import { UnrealBloomPass } from 'three-stdlib';

import {
  BakeShadows,
  Effects,
  PerspectiveCamera,
  Sparkles,
} from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

import Logo from 'components/elements/logo/Logo';
import CameraRig from 'components/rigging/CameraRig';
import LightingRig from 'components/rigging/LightingRig';

extend({ UnrealBloomPass });

function neonFlicker(
  time,
  baseIntensity = 8,
  flickerIntensity = 2,
  flickerFrequency = 10
) {
  const seconds = time / 1000;
  const noise = Math.random() * flickerIntensity;
  const flickerOscillation = Math.sin(seconds * 2 * Math.PI * flickerFrequency);
  const emissiveIntensity =
    baseIntensity + flickerIntensity * flickerOscillation + noise;
  return Math.max(1, Math.min(10, emissiveIntensity));
}

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
    sparkleColor,
    sparkleCount,
    sparkleNoise,
    sparkleOpactity,
    sparkleScale,
    sparkleSize,
    sparkleSpeed,
    enableNeonFlicker,
    neonFlickerIntensity,
    neonFlickerFrequency,
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
          Neon: folder(
            {
              enableNeonFlicker: { label: 'Flicker', value: true },
              neonFlickerIntensity: {
                label: 'Intensity',
                value: 2,
                min: 0.1,
                max: 10,
              },
              neonFlickerFrequency: {
                label: 'Frequency',
                value: 10,
                min: 0.1,
                max: 10,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
      Sparkles: folder(
        {
          sparkleCount: { label: 'Count', value: 100, min: 10, max: 500 },
          sparkleSpeed: { label: 'Speed', value: 0.71, min: 0, max: 10 },
          sparkleOpactity: { label: 'Opacity', value: 0.7, min: 0, max: 1 },
          sparkleColor: { label: 'Color', value: '#FFFFFF' },
          sparkleSize: { label: 'Size', value: 0.7, min: 0.1, max: 10 },
          sparkleScale: { label: 'Scale', value: 3.6, min: 0, max: 10 },
          sparkleNoise: { label: 'Noise', value: 1, min: 0, max: 10 },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const [
    { reversalEmissiveIntensity, bretEmissiveIntensity },
    setEmissiveIntensity,
  ] = useState({ reversalEmissiveIntensity: 0, bretEmissiveIntensity: 0 });

  useFrame(({ clock }) => {
    if (enableNeonFlicker) {
      setEmissiveIntensity({
        reversalEmissiveIntensity: neonFlicker(
          clock.getElapsedTime(),
          reversalInnerColorEmissiveIntensity,
          neonFlickerIntensity,
          neonFlickerFrequency
        ),
        bretEmissiveIntensity: neonFlicker(
          clock.getElapsedTime(),
          bretInnerColorEmissiveIntensity,
          neonFlickerIntensity,
          neonFlickerFrequency
        ),
      });
    } else if (
      reversalEmissiveIntensity !== reversalInnerColorEmissiveIntensity ||
      bretEmissiveIntensity !== bretInnerColorEmissiveIntensity
    ) {
      setEmissiveIntensity({
        reversalEmissiveIntensity: reversalInnerColorEmissiveIntensity,
        bretEmissiveIntensity: bretInnerColorEmissiveIntensity,
      });
    }
  });

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
          bretInnerColorEmissiveIntensity: bretEmissiveIntensity,
          bretEmissiveIntensity,
          bretOuterColor,
          bretOuterColorEmissive,
          bretOuterColorEmissiveIntensity,
          reversalPosition,
          reversalRotation,
          reversalInnerColor,
          reversalInnerColorEmissive,
          reversalInnerColorEmissiveIntensity: reversalEmissiveIntensity,
          reversalOuterColor,
          reversalOuterColorEmissive,
          reversalOuterColorEmissiveIntensity,
        }}
      />

      <Sparkles
        count={sparkleCount}
        speed={sparkleSpeed}
        opacity={sparkleOpactity}
        color={sparkleColor}
        size={sparkleSize}
        scale={sparkleScale}
        noise={sparkleNoise}
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
