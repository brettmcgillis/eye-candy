/* eslint-disable no-unused-vars */
import { useControls } from 'leva';

import React from 'react';

import { Environment, OrbitControls, Plane } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';

import Record from '../../../../elements/record/Record';
import LightingRig from '../../../../rigging/LightingRig';
import Censor from './censor/Censor';
import PixelMask from './composed/PixelMask';
import PixelMaskEffect from './composed/PixelMaskEffectComponent';

export default function PixelHater() {
  const {
    bgType,
    bgPreset,
    bgBlur,
    bgColor,
    pixelEffect,
    effectShape,
    pixelSize,
    planeHeight,
    planeWidth,
    refraction,
  } = useControls(
    '👾',
    {
      bgType: {
        label: 'Background',
        options: { Environment: 'environment', Color: 'color' },
        value: 'environment',
      },
      bgPreset: {
        label: 'Preset',
        options: [
          'apartment',
          'city',
          'dawn',
          'forest',
          'lobby',
          'night',
          'park',
          'studio',
          'sunset',
          'warehouse',
        ],
        value: 'studio',
        render: (get) => get('👾.bgType') === 'environment',
      },
      bgBlur: {
        label: 'Blur',
        value: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        render: (get) => get('👾.bgType') === 'environment',
      },
      bgColor: {
        label: 'Color',
        value: '#111111',
        render: (get) => get('👾.bgType') === 'color',
      },
      pixelEffect: {
        label: 'Effect',
        options: {
          Yours: 'Yours',
          Mine: 'Mine',
          Censor: 'Censor',
        },
        value: 'Censor',
      },
      effectShape: {
        label: 'Effect Shape',
        options: {
          Plane: 'Plane',
          TwoPanes: 'TwoPanes',
          Cube: 'Cube',
          Cubes: 'Cubes',
          Torus: 'Torus',
          Sphere: 'Sphere',
          Knot: 'Knot',
        },
        value: 'TwoPanes',
        // render: (get) => get('pixelEffect') === 'Mine',
      },
      pixelSize: { label: 'Pixel Size', value: 8, min: 1, max: 32, step: 1 },
      planeHeight: {
        label: 'Plane Height',
        value: 1,
        min: 1,
        max: 10,
        step: 0.25,
        // render: (get) =>
        //   get('pixelEffect') === 'Mine' && get('effectShape') === 'Plane',
      },
      planeWidth: {
        label: 'Plane Width',
        value: 5,
        min: 1,
        max: 10,
        step: 0.25,
        // render: (get) => {
        //   console.log(get('Pixel Effect'), get('effectShape'), get('👾'));
        //   return (
        //     get('pixelEffect') === 'Mine' && get('effectShape') === 'Plane'
        //   );
        // },
      },
      refraction: {
        label: 'Refraction',
        value: 0,
        min: 0,
        max: 0.15,
        step: 0.005,
      },
    },
    { collapsed: true }
  );

  return (
    <>
      <LightingRig />
      <OrbitControls enableDamping enablePan enableRotate enableZoom />

      <Environment
        preset={bgPreset}
        background={bgType === 'environment'}
        blur={bgBlur}
      />
      {bgType === 'color' && <color attach="background" args={[bgColor]} />}

      <Record scale={10} position={[0, 0, -1]} rotation={[0, 0, 0]} />

      <mesh position={[0, 0, 1]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshPhysicalMaterial color="hotpink" />
      </mesh>

      {/* V2 — forward-rendered censor material (no postprocessing) */}
      {pixelEffect === 'Censor' && (
        <>
          {effectShape === 'Plane' && (
            <Censor pixelSize={pixelSize} refraction={refraction}>
              <planeGeometry args={[planeWidth, planeHeight]} />
            </Censor>
          )}
          {effectShape === 'TwoPanes' && (
            <>
              <Censor
                pixelSize={pixelSize}
                refraction={refraction}
                position={[0.5, 0.5, 0]}
              >
                <planeGeometry args={[1, 1]} />
              </Censor>
              <Censor
                pixelSize={pixelSize}
                refraction={refraction}
                position={[-0.5, -0.5, 0]}
              >
                <planeGeometry args={[1, 1]} />
              </Censor>
            </>
          )}
          {effectShape === 'Cube' && (
            <Censor pixelSize={pixelSize} refraction={refraction}>
              <boxGeometry args={[1, 1, 1]} />
            </Censor>
          )}
          {effectShape === 'Cubes' && (
            <Censor
              pixelSize={pixelSize}
              refraction={refraction}
              clipOffset={0.5}
              position={[0, 0, 1]}
            >
              <boxGeometry args={[1, 1, 1]} />
            </Censor>
          )}
          {effectShape === 'Torus' && (
            <Censor pixelSize={pixelSize} refraction={refraction}>
              <torusGeometry args={[0.5, 0.15, 16, 100]} />
            </Censor>
          )}
          {effectShape === 'Sphere' && (
            <Censor pixelSize={pixelSize} refraction={refraction}>
              <sphereGeometry args={[0.4, 32, 32]} />
            </Censor>
          )}
          {effectShape === 'Knot' && (
            <Censor pixelSize={pixelSize} refraction={refraction}>
              <torusKnotGeometry args={[0.5, 0.1, 100, 16]} />
            </Censor>
          )}
        </>
      )}

      {/* V0/V1 — postprocessing effects */}
      {pixelEffect !== 'Censor' && (
        <EffectComposer multisampling={0} enableNormalPass>
          {pixelEffect === 'Yours' && <Pixelation granularity={pixelSize} />}
          {pixelEffect === 'Mine' && (
            <PixelMaskEffect pixelSize={pixelSize}>
              <PixelMask>
                {effectShape === 'Plane' && (
                  <Plane args={[planeWidth, planeHeight]}>
                    <meshBasicMaterial />
                  </Plane>
                )}
                {effectShape === 'TwoPanes' && (
                  <>
                    <mesh position={[0.5, 0.5, 0]}>
                      <planeGeometry args={[1, 1]} />
                      <meshBasicMaterial />
                    </mesh>

                    <mesh position={[-0.5, -0.5, 0]}>
                      <planeGeometry args={[1, 1]} />
                      <meshBasicMaterial />
                    </mesh>
                  </>
                )}
                {effectShape === 'Cube' && (
                  <mesh position={(0, 0, 0)}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial />
                    ``
                  </mesh>
                )}
                {effectShape === 'Cubes' && (
                  <>
                    <mesh position={[0, 0, 1]}>
                      <boxGeometry args={[1, 1, 1]} />
                      <meshBasicMaterial />
                    </mesh>

                    {/* <mesh position={[0, 0, -1]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial />
                  </mesh> */}
                  </>
                )}
                {effectShape === 'Torus' && (
                  <mesh>
                    <torusGeometry args={[0.5, 0.15, 16, 100]} />
                    <meshBasicMaterial />
                  </mesh>
                )}
                {effectShape === 'Sphere' && (
                  <mesh>
                    <sphereGeometry args={[0.4, 32, 32]} />
                    <meshBasicMaterial />
                  </mesh>
                )}
                {effectShape === 'Knot' && (
                  <mesh>
                    <torusKnotGeometry args={[0.5, 0.1, 100, 16]} />
                    <meshBasicMaterial />
                  </mesh>
                )}
              </PixelMask>
            </PixelMaskEffect>
          )}
        </EffectComposer>
      )}
    </>
  );
}
