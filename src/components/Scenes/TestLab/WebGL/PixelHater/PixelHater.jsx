import React from 'react';

import { Environment, OrbitControls, Plane } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';

import Record from '../../../../elements/record/Record';
import LightingRig from '../../../../rigging/LightingRig';
import CensorShapes from './censor/CensorShapes';
import PixelMask from './composed/PixelMask';
import PixelMaskEffect from './composed/PixelMaskEffectComponent';
import usePixelHaterControls from './usePixelHaterControls';

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
  } = usePixelHaterControls();

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
        <CensorShapes
          effectShape={effectShape}
          pixelSize={pixelSize}
          refraction={refraction}
          planeWidth={planeWidth}
          planeHeight={planeHeight}
        />
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
