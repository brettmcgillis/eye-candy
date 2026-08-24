import React from 'react';

import { Environment, OrbitControls, Plane } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';

import { CensorShapes } from '@elements/Censor';
import Record from '@elements/Record/Record';

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
    voxelSize,
    voxelSteps,
    cornerRadius,
    insideOnly,
    plPosition,
    plDecay,
    plDistance,
    plIntensity,
    plCastShadow,
    ambientLightIntensity,
  } = usePixelHaterControls();

  const censorModeByEffect = {
    Censor: 'pixel',
    VoxelScreen: 'voxelScreen',
    VoxelRaymarch: 'voxelRaymarch',
    VoxelInstanced: 'voxelInstanced',
    VoxelInterior: 'voxelInterior',
  };
  const censorMode = censorModeByEffect[pixelEffect] ?? null;
  const usePostEffect = pixelEffect === 'Yours' || pixelEffect === 'Mine';

  return (
    <>
      <group>
        <ambientLight intensity={ambientLightIntensity} />
        <pointLight
          position={[plPosition.x, plPosition.y, plPosition.z]}
          decay={plDecay}
          distance={plDistance}
          intensity={plIntensity}
          castShadow={plCastShadow}
        />
      </group>

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
      {censorMode && (
        <CensorShapes
          effectShape={effectShape}
          pixelSize={pixelSize}
          refraction={refraction}
          planeWidth={planeWidth}
          planeHeight={planeHeight}
          voxelMode={censorMode}
          voxelSize={voxelSize}
          voxelSteps={voxelSteps}
          cornerRadius={cornerRadius}
          insideOnly={insideOnly}
        />
      )}

      {/* V0/V1 — postprocessing effects */}
      {usePostEffect && (
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
                  <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial />
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
