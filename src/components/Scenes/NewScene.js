/* eslint-disable no-unused-vars */
import { folder, useControls } from 'leva';
import React from 'react';

import {
  AsciiRenderer,
  Cloud,
  Clouds,
  Float,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';

import Femur from 'components/elements/femur/Femur';
import Halo from 'components/elements/halo/Halo';
import Record from 'components/elements/record/Record';
import Skull from 'components/elements/skull/Skull';
import { useSkullControls } from 'components/elements/skull/SkullControls';
import CameraRig from 'components/rigging/CameraRig';
import { GridHelper, PolarGridHelper } from 'components/rigging/GridHelper';
import LightingRig from 'components/rigging/LightingRig';

import getColorsInRange from 'utils/colors';
import { getRandomNumber, radians } from 'utils/math';

function useSceneControls() {
  return useControls(
    'Scene',
    {
      showGridHelper: { label: 'Show Grid Helper', value: false },
      showPolarGridHelper: { label: 'Show Polar Grid Helper', value: false },
      Halo: folder(
        {
          haloPosition: { label: 'Position', value: { x: 0, y: 1.5, z: -1 } },
          haloRotation: {
            label: 'Rotation',
            value: { x: 45, y: 0, z: 0 },
          },
          haloScale: {
            label: 'Scale',
            value: 12,
            min: 0.1,
            max: 12,
            step: 0.1,
          },
          haloVisible: { label: 'Visible', value: true },
        },
        { collapsed: true }
      ),
      Skull: folder(
        {
          skullPosition: { label: 'Position', value: { x: 0, y: 0, z: 0 } },
          skullRotation: { label: 'Rotation', value: { x: 0, y: 0, z: 0 } },
          skullScale: {
            label: 'Scale',
            value: 0.1,
            min: 0.01,
            max: 1,
            step: 0.01,
          },
          skullVisible: { label: 'Visible', value: true },
        },
        { collapsed: true }
      ),
      Cloud: folder(
        {
          cloudPosition: { label: 'Position', value: { x: 0, y: 0.75, z: 0 } },
          cloudRotation: { label: 'Rotation', value: { x: 0, y: 0, z: 0 } },
          cloudScale: {
            label: 'Scale',
            value: 0.15,
            min: 0.01,
            max: 1,
            step: 0.01,
          },
          cloudVisible: { label: 'Visible', value: true },
        },
        { collapsed: true }
      ),
      Femur: folder(
        {
          femurPosition: {
            label: 'Position',
            value: { x: -3, y: -3, z: -0.05 },
          },
          femurRotation: { label: 'Rotation', value: { x: 0, y: 0, z: -66 } },
          femurScale: {
            label: 'Scale',
            value: 0.75,
            min: 0.1,
            max: 1,
            step: 0.01,
          },
          femurVisible: { label: 'Visible', value: true },
        },
        { collapsed: true }
      ),
      Effects: folder(
        {
          autoRotateSpeed: {
            label: 'Rotate Speed',
            value: 0,
            min: -50,
            max: 50,
          },
          floatSpeed: {
            label: 'Float Speed',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
          },
          pixelationEnabled: { label: 'Pixelation Enabled', value: false },
          pixelationGranularity: {
            label: 'Pixelation Granularity',
            value: 8,
            min: 0,
            max: 50,
            step: 1,
          },
          asciiEnabled: { label: 'Ascii Enabled', value: false },
          asciiBgColor: { label: 'Ascii BG Color', value: '#FFFFFF' },
          asciiFgColor: { label: 'Ascii FG Color', value: '#000000' },
          asciiCharSet: {
            label: 'Ascii Char Set',
            value:
              " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@",
          },
          asciiInvert: { label: 'Ascii Invert', value: false },
          asciiColorize: { label: 'Ascii Colorize', value: true },
          asciiResolution: {
            label: 'Ascii Resolution',
            value: 0.25,
            min: 0.1,
            max: 0.4,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}

function useCloudControls() {
  return useControls(
    'Cloud',
    {
      seed: { value: getRandomNumber(1, 100), min: 1, max: 100, step: 1 },
      segments: { value: 50, min: 1, max: 80, step: 1 },
      volume: { value: 6, min: 0, max: 100, step: 0.1 },
      opacity: { value: 0.8, min: 0, max: 1, step: 0.01 },
      fade: { value: 0, min: 0, max: 400, step: 1 },
      growth: { value: 4, min: 0, max: 20, step: 1 },
      speed: { value: 0.5, min: 0, max: 1, step: 0.01 },
      x: { value: 6, min: 0, max: 10, step: 1 },
      y: { value: 1, min: 0, max: 10, step: 1 },
      z: { value: 1, min: 0, max: 10, step: 1 },
      color: '#bababa',
    },
    { collapsed: true }
  );
}

function useHaloControls() {
  return useControls(
    'Halo',
    {
      innerRadius: {
        label: 'Inner Radius',
        value: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
      },
      outerRadius: {
        label: 'Outer Radius',
        value: 2,
        min: 2,
        max: 20,
        step: 0.1,
      },
      style: {
        label: 'Style',
        value: 'default',
        options: {
          Default: 'default',
          Gradient: 'gradient',
        },
      },
      start: {
        label: 'Start',
        value: '#FFFFFF',
        render: (get) => get('Halo.style') === 'gradient',
      },
      end: {
        label: 'End',
        value: '#000000',
        render: (get) => get('Halo.style') === 'gradient',
      },
      steps: {
        label: 'Steps',
        value: 8,
        min: 2,
        max: 20,
        step: 1,
        render: (get) => get('Halo.style') === 'gradient',
      },
      sm: {
        value: 0.1,
        min: 0.1,
        max: 3,
        step: 0.1,
        render: (get) => get('Halo.style') === 'default',
      },
      med: {
        value: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        render: (get) => get('Halo.style') === 'default',
      },
      lg: {
        value: 2,
        min: 0.1,
        max: 3,
        step: 0.1,
        render: (get) => get('Halo.style') === 'default',
      },
      xl: {
        value: 3,
        min: 0.1,
        max: 3,
        step: 0.1,
        render: (get) => get('Halo.style') === 'default',
      },
      silver: {
        label: 'Silver',
        value: '#c1c1c1',
        render: (get) => get('Halo.style') === 'default',
      },
      white: {
        label: 'White',
        value: '#ffffff',
        render: (get) => get('Halo.style') === 'default',
      },
      black: {
        label: 'Black',
        value: '#000000',
        render: (get) => get('Halo.style') === 'default',
      },
      blue: {
        label: 'Blue',
        value: '#0023ff',
        render: (get) => get('Halo.style') === 'default',
      },
      lightblue: {
        label: 'Light Blue',
        value: '#69d8ff',
        render: (get) => get('Halo.style') === 'default',
      },
    },
    { collapsed: true }
  );
}

function getHaloConfig(haloControls) {
  const {
    innerRadius,
    outerRadius,
    style,
    start,
    end,
    steps,
    sm,
    med,
    lg,
    xl,
    silver,
    white,
    black,
    blue,
    lightblue,
  } = haloControls;
  const width = outerRadius - innerRadius;

  const gradientColors = getColorsInRange(start, end, steps).map((v) => ({
    width: width / steps,
    color: v,
  }));

  const colors = [
    { width: lg, color: silver },
    { width: sm, color: black },
    { width: med, color: white },
    { width: xl, color: black },
    { width: xl, color: blue },
    { width: xl, color: lightblue },
    { width: sm, color: black },
    { width: lg, color: silver },
  ];
  const totalWidthRatio = colors.reduce((total, ring) => total + ring.width, 0);
  const rings =
    style === 'gradient'
      ? gradientColors
      : colors.map((color) => {
          const normalizedWidth = (color.width / totalWidthRatio) * width;
          const roundedWidth = Math.round(normalizedWidth * 100) / 100;
          return { ...color, width: roundedWidth };
        });
  return {
    innerRadius,
    rings,
  };
}

export default function NewScene() {
  const scene = useSceneControls();

  const skullControls = useSkullControls({
    cranium: {
      showRightParietal: false,
      showRightTemporal: false,
      showTeeth: false,
      showLeftParietal: false,
      showLeftTemporal: false,
    },
    mandible: {
      showMandible: false,
    },
  });

  const cloudControls = useCloudControls();

  const haloControls = useHaloControls();

  return (
    <>
      {/* <CameraRig screenShot /> */}

      <LightingRig />
      <PerspectiveCamera makeDefault position={[-1, -1, 3.5]} />

      <GridHelper x y z visible={scene.showGridHelper} />
      <PolarGridHelper x y z visible={scene.showPolarGridHelper} />

      <OrbitControls
        autoRotate
        enableDamping
        enablePan
        enableRotate
        enableZoom
        autoRotateSpeed={scene.autoRotateSpeed}
      />
      <Float speed={scene.floatSpeed}>
        <Halo
          visible={scene.haloVisible}
          position={[
            scene.haloPosition.x,
            scene.haloPosition.y,
            scene.haloPosition.z,
          ]}
          rotation={[
            radians(scene.haloRotation.x),
            radians(scene.haloRotation.y),
            radians(scene.haloRotation.z),
          ]}
          {...getHaloConfig(haloControls)}
        />

        {/* <Record
        scale={scene.haloScale}
        position={[
          scene.haloPosition.x,
          scene.haloPosition.y,
          scene.haloPosition.z,
        ]}
        rotation={[
          radians(scene.haloRotation.x),
          radians(scene.haloRotation.y),
          radians(scene.haloRotation.z),
        ]}
      /> */}

        <Skull
          {...skullControls}
          position={[
            scene.skullPosition.x,
            scene.skullPosition.y,
            scene.skullPosition.z,
          ]}
          rotation={[
            radians(scene.skullRotation.x),
            radians(scene.skullRotation.y),
            radians(scene.skullRotation.z),
          ]}
          scale={scene.skullScale}
          visible={scene.skullVisible}
        />
        <Clouds visible={scene.cloudVisible}>
          <Cloud
            position={[
              scene.cloudPosition.x,
              scene.cloudPosition.y,
              scene.cloudPosition.z,
            ]}
            rotation={[
              radians(scene.cloudRotation.x),
              radians(scene.cloudRotation.y),
              radians(scene.cloudRotation.z),
            ]}
            bounds={[cloudControls.x, cloudControls.y, cloudControls.z]}
            scale={scene.cloudScale}
            {...cloudControls}
            castShadow
            receiveShadow
          />
        </Clouds>
        <Femur
          position={[
            scene.femurPosition.x,
            scene.femurPosition.y,
            scene.femurPosition.z,
          ]}
          rotation={[
            radians(scene.femurRotation.x),
            radians(scene.femurRotation.y),
            radians(scene.femurRotation.z),
          ]}
          scale={scene.femurScale}
          visible={scene.femurVisible}
        />
      </Float>

      {scene.asciiEnabled && (
        <AsciiRenderer
          bgColor={scene.asciiBgColor}
          fgColor={scene.asciiFgColor}
          characters={scene.asciiCharSet}
          /** Invert character, default: true */
          invert={scene.asciiInvert}
          /** Colorize output (very expensive!), default: false */
          color={scene.asciiColorize}
          /** Level of detail, default: 0.15 */
          resolution={scene.asciiResolution}
        />
      )}
      <EffectComposer>
        <Pixelation
          granularity={
            scene.pixelationEnabled ? scene.pixelationGranularity : 0
          }
        />
      </EffectComposer>
    </>
  );
}
