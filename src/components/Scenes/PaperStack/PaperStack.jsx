/* eslint-disable react/no-array-index-key */
import { folder, useControls } from 'leva';
import * as THREE from 'three';

import React, { useMemo } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';

import CameraRig from '../../rigging/CameraRig';
import LightingRig from '../../rigging/LightingRig';

const COLORS = [
  'black',
  'violet',
  'indigo',
  'blue',
  'green',
  'yellow',
  'orange',
  'red',
  'white',
  'black',
];

function Stack() {
  const {
    layerWidth,
    layerDepth,
    layerDepthBuffer,
    layerHeight,

    windowSize01,
    minSizeRatio,
    maxSizeRatio,

    windowXY,
    windowZ,

    taperAmount,
    taperCurve,

    squareSpacing,

    patternRotationDeg,
    windowRotationDeg,

    spiralTwistDeg,
    spiralCurve,
  } = useControls('Paper Stack', {
    Stack: folder(
      {
        layerHeight: { value: 4, min: 1, max: 10 },
        layerWidth: { value: 10, min: 1, max: 20 },
        layerDepth: { value: 0.01, min: 0.005, max: 0.1 },
        layerDepthBuffer: { value: 0.01, min: 0, max: 0.1 },
      },
      { collapsed: true }
    ),

    Window: folder(
      {
        windowSize01: { label: 'Size', value: 0.5, min: 0, max: 1 },

        minSizeRatio: { label: 'Min Size %', value: 0.12, min: 0.02, max: 0.4 },
        maxSizeRatio: { label: 'Max Size %', value: 0.38, min: 0.1, max: 0.48 },

        windowXY: { value: { x: 0, y: 0 } },
        windowZ: { value: 0.005, min: -0.1, max: 0.1 },

        squareSpacing: { value: 0.9, min: 0.4, max: 1.4 },

        patternRotationDeg: {
          label: 'Pattern Rot (°)',
          value: 0,
          min: 0,
          max: 180,
          step: 1,
        },

        windowRotationDeg: {
          label: 'Square Rot (°)',
          value: 0,
          min: 0,
          max: 90,
          step: 1,
        },
      },
      { collapsed: false }
    ),

    Stepping: folder(
      {
        taperAmount: { value: 0.22, min: 0, max: 0.9 },
        taperCurve: { value: 2.2, min: 0.4, max: 4, step: 0.1 },
      },
      { collapsed: false }
    ),

    Spiral: folder(
      {
        spiralTwistDeg: {
          label: 'Total Spiral (°)',
          value: 0,
          min: -360,
          max: 360,
          step: 1,
        },
        spiralCurve: {
          label: 'Spiral Curve',
          value: 1.6,
          min: 0.2,
          max: 4,
          step: 0.1,
        },
      },
      { collapsed: false }
    ),
  });

  /* ---------------- Angles ---------------- */

  const patternRotation = THREE.MathUtils.degToRad(patternRotationDeg);
  const windowRotation = THREE.MathUtils.degToRad(windowRotationDeg);
  const spiralTotal = THREE.MathUtils.degToRad(spiralTwistDeg);

  const layerStep = layerDepth + layerDepthBuffer;
  const layerCount = COLORS.length;

  /* ---------------- Materials ---------------- */

  const materials = useMemo(
    () =>
      COLORS.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c,
            side: THREE.DoubleSide,
          })
      ),
    []
  );

  /* ---------------- Geometry ---------------- */

  const paperGeo = useMemo(
    () => new THREE.BoxGeometry(layerWidth, layerHeight, layerDepth),
    [layerWidth, layerHeight, layerDepth]
  );

  const cutGeo = useMemo(
    () => new THREE.BoxGeometry(1, 1, layerDepth * 6),
    [layerDepth]
  );

  /* ---------------- Window size ---------------- */

  const safeWindowSize = useMemo(() => {
    const base = Math.min(layerWidth, layerHeight);
    const min = base * minSizeRatio;
    const max = base * maxSizeRatio;
    return THREE.MathUtils.lerp(min, max, windowSize01);
  }, [layerWidth, layerHeight, minSizeRatio, maxSizeRatio, windowSize01]);

  /* ---------------- Layers ---------------- */

  const layers = useMemo(
    () =>
      COLORS.map((_, i) => {
        const t = i / (layerCount - 1);
        const curved = t ** taperCurve;
        const scale = THREE.MathUtils.lerp(1, 1 - taperAmount, curved);

        const spiralT = t ** spiralCurve;
        const spiral = spiralTotal * spiralT;

        return {
          i,
          z: -i * layerStep,
          scale,
          spiral,
        };
      }),
    [layerStep, layerCount, taperAmount, taperCurve, spiralTotal, spiralCurve]
  );

  /* ---------------- Base square layout ---------------- */

  const baseOffsets = useMemo(() => {
    const d = safeWindowSize * squareSpacing;
    return [
      [d, d],
      [-d, d],
      [d, -d],
      [-d, -d],
    ];
  }, [safeWindowSize, squareSpacing]);

  /* ---------------- Render ---------------- */

  return (
    <group>
      {layers.map((layer) => (
        <mesh
          key={layer.i}
          castShadow
          receiveShadow
          material={materials[layer.i]}
          position={[0, 0, layer.z]}
        >
          <Geometry computeVertexNormals>
            {/* Paper sheet */}
            <Base geometry={paperGeo} />

            {/* Windows (only affect this sheet) */}
            {baseOffsets.map((o, j) => {
              const angle = patternRotation + layer.spiral;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);

              const x = o[0] * cos - o[1] * sin;
              const y = o[0] * sin + o[1] * cos;

              return (
                <Subtraction
                  key={`cut-${layer.i}-${j}`}
                  geometry={cutGeo}
                  rotation={[0, 0, windowRotation + layer.spiral]}
                  position={[
                    windowXY.x + x * layer.scale,
                    windowXY.y + y * layer.scale,
                    windowZ,
                  ]}
                  scale={[
                    safeWindowSize * layer.scale,
                    safeWindowSize * layer.scale,
                    1,
                  ]}
                />
              );
            })}
          </Geometry>
        </mesh>
      ))}
    </group>
  );
}

export default function PaperStack() {
  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <ambientLight intensity={1} />
      <LightingRig />
      <CameraRig screenShot />

      <Stack />

      {/* sanity plane */}
      {/* <mesh position={[0, 0, -4]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#893131" />
      </mesh> */}
    </>
  );
}
