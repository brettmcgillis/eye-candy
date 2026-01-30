/* eslint-disable no-unused-vars */
import { useControls } from 'leva';

import React from 'react';

import { Environment, OrbitControls, Plane } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';

import Record from '../../elements/record/Record';
import LightingRig from '../../rigging/LightingRig';
import PixelMask from './composed/PixelMask';
import PixelMaskEffect from './composed/PixelMaskEffectComponent';

export default function PixelHater() {
  const { pixelEffect, effectShape, pixelSize, planeHeight, planeWidth } =
    useControls(
      '👾',
      {
        pixelEffect: {
          label: 'Effect',
          options: {
            Yours: 'Yours',
            Mine: 'Mine',
          },
          value: 'Yours',
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
      },
      {}
    );

  return (
    <>
      <LightingRig />
      <OrbitControls enableDamping enablePan enableRotate enableZoom />

      <Environment preset="studio" background blur={0.25} />

      <Record scale={10} position={[0, 0, -1]} rotation={[0, 0, 0]} />

      <mesh position={[0, 0, 1]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshPhysicalMaterial color="hotpink" />
      </mesh>

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
    </>
  );
}
