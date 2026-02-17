/* eslint-disable react/no-array-index-key */
import { folder, useControls } from 'leva';
import * as THREE from 'three';

import React, { useMemo } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';
import {
  AccumulativeShadows,
  PerspectiveCamera,
  PresentationControls,
  RandomizedLight,
} from '@react-three/drei';

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

function usePaperStackConfig() {
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

    stackX,
    stackY,
    stackZ,
    stackRotXDeg,
    stackRotYDeg,
    stackRotZDeg,

    chipsX,
    chipsY,
    chipsZ,
    chipsPitchDeg,
    chipsRotXDeg,
    chipsRotYDeg,
    chipsRotZDeg,

    accumFrames,
    accumColor,
    accumColorBlend,
    accumOpacity,
    accumScale,
    accumAlphaTest,
    accumX,
    accumY,
    accumZ,

    lightAmount,
    lightRadius,
    lightAmbient,
    lightBias,
    lightX,
    lightY,
    lightZ,
  } = useControls('Paper Stack', {
    Stack: folder(
      {
        stackX: { label: 'X', value: 0, min: -20, max: 20, step: 0.1 },
        stackY: { label: 'Y', value: 0, min: -20, max: 20, step: 0.1 },
        stackZ: { label: 'Z', value: 0, min: -20, max: 20, step: 0.1 },
        stackRotXDeg: {
          label: 'Rot X (°)',
          value: 0,
          min: -180,
          max: 180,
          step: 1,
        },
        stackRotYDeg: {
          label: 'Rot Y (°)',
          value: 0,
          min: -180,
          max: 180,
          step: 1,
        },
        stackRotZDeg: {
          label: 'Rot Z (°)',
          value: 0,
          min: -180,
          max: 180,
          step: 1,
        },
        layerHeight: { value: 4, min: 1, max: 10 },
        layerWidth: { value: 10, min: 1, max: 20 },
        layerDepth: { value: 0.01, min: 0.005, max: 0.1 },
        layerDepthBuffer: { value: 0.01, min: 0, max: 0.1 },
      },
      { collapsed: true }
    ),

    Window: folder(
      {
        windowSize01: { label: 'Size', value: 0.75, min: 0, max: 1 },

        minSizeRatio: { label: 'Min Size %', value: 0.12, min: 0.02, max: 0.4 },
        maxSizeRatio: { label: 'Max Size %', value: 0.38, min: 0.1, max: 0.48 },

        windowXY: { value: { x: 0, y: 0 } },
        windowZ: { value: 0.005, min: -0.1, max: 0.1 },

        squareSpacing: { value: 0.69, min: 0.4, max: 1.4 },

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
      { collapsed: true }
    ),

    Stepping: folder(
      {
        taperAmount: { value: 0.22, min: 0, max: 0.9 },
        taperCurve: { value: 2.2, min: 0.4, max: 4, step: 0.1 },
      },
      { collapsed: true }
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
      { collapsed: true }
    ),

    Chips: folder(
      {
        chipsX: { label: 'X', value: 0, min: -20, max: 20, step: 0.1 },
        chipsY: { label: 'Y', value: 0, min: -20, max: 20, step: 0.1 },
        chipsZ: { label: 'Z', value: 2.8, min: -20, max: 20, step: 0.1 },
        chipsPitchDeg: {
          label: 'Pitch (°)',
          value: -90,
          min: -180,
          max: 180,
          step: 1,
        },
        chipsRotXDeg: {
          label: 'Rot X (°)',
          value: 0,
          min: -180,
          max: 180,
          step: 1,
        },
        chipsRotYDeg: {
          label: 'Rot Y (°)',
          value: 45,
          min: -180,
          max: 180,
          step: 1,
        },
        chipsRotZDeg: {
          label: 'Rot Z (°)',
          value: 0,
          min: -180,
          max: 180,
          step: 1,
        },
      },
      { collapsed: true }
    ),

    Shadows: folder(
      {
        accumFrames: { label: 'Frames', value: 200, min: 1, max: 400, step: 1 },
        accumColor: { label: 'Color', value: '#000000' },
        accumColorBlend: {
          label: 'Color Blend',
          value: 0.5,
          min: 0,
          max: 1,
          step: 0.01,
        },
        accumOpacity: {
          label: 'Opacity',
          value: 1,
          min: 0,
          max: 1,
          step: 0.01,
        },
        accumScale: { label: 'Scale', value: 40, min: 1, max: 40, step: 0.1 },
        accumAlphaTest: {
          label: 'Alpha Test',
          value: 0.55,
          min: 0,
          max: 1,
          step: 0.01,
        },
        accumX: { label: 'X', value: 0, min: -20, max: 20, step: 0.1 },
        accumY: { label: 'Y', value: 0, min: -20, max: 20, step: 0.1 },
        accumZ: { label: 'Z', value: 0, min: -20, max: 20, step: 0.1 },
        lightAmount: {
          label: 'Light Amount',
          value: 8,
          min: 1,
          max: 24,
          step: 1,
        },
        lightRadius: {
          label: 'Light Radius',
          value: 5,
          min: 0.1,
          max: 20,
          step: 0.1,
        },
        lightAmbient: {
          label: 'Light Ambient',
          value: 0.5,
          min: 0,
          max: 1,
          step: 0.01,
        },
        lightBias: {
          label: 'Light Bias',
          value: 0.001,
          min: 0,
          max: 0.02,
          step: 0.0001,
        },
        lightX: { label: 'Light X', value: 5, min: -20, max: 20, step: 0.1 },
        lightY: { label: 'Light Y', value: 3, min: -20, max: 20, step: 0.1 },
        lightZ: { label: 'Light Z', value: 2, min: -20, max: 20, step: 0.1 },
      },
      { collapsed: true }
    ),
  });

  /* ---------------- Angles ---------------- */

  const patternRotation = THREE.MathUtils.degToRad(patternRotationDeg);
  const windowRotation = THREE.MathUtils.degToRad(windowRotationDeg);
  const spiralTotal = THREE.MathUtils.degToRad(spiralTwistDeg);

  const layerStep = layerDepth + layerDepthBuffer;
  const layerCount = COLORS.length;

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

  return {
    layerWidth,
    layerDepth,
    layerHeight,
    stackX,
    stackY,
    stackZ,
    stackRotation: [
      THREE.MathUtils.degToRad(stackRotXDeg),
      THREE.MathUtils.degToRad(stackRotYDeg),
      THREE.MathUtils.degToRad(stackRotZDeg),
    ],
    windowXY,
    windowZ,
    patternRotation,
    windowRotation,
    safeWindowSize,
    layers,
    baseOffsets,
    chipsX,
    chipsY,
    chipsZ,
    chipsPitch: THREE.MathUtils.degToRad(chipsPitchDeg),
    chipsRotation: [
      THREE.MathUtils.degToRad(chipsRotXDeg),
      THREE.MathUtils.degToRad(chipsRotYDeg),
      THREE.MathUtils.degToRad(chipsRotZDeg),
    ],
    shadows: {
      accumFrames,
      accumColor,
      accumColorBlend,
      accumOpacity,
      accumScale,
      accumAlphaTest,
      accumPosition: [accumX, accumY, accumZ],
      lightAmount,
      lightRadius,
      lightAmbient,
      lightBias,
      lightPosition: [lightX, lightY, lightZ],
    },
  };
}

function getWindowTransform(baseOffset, layer, config) {
  const angle = config.patternRotation + layer.spiral;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const x = baseOffset[0] * cos - baseOffset[1] * sin;
  const y = baseOffset[0] * sin + baseOffset[1] * cos;

  return {
    x: config.windowXY.x + x * layer.scale,
    y: config.windowXY.y + y * layer.scale,
    zRotation: config.windowRotation + layer.spiral,
    size: config.safeWindowSize * layer.scale,
  };
}

function Stack({ config, materials }) {
  const { layerWidth, layerHeight, layerDepth, layerZ, layers, baseOffsets } = {
    ...config,
    layerZ: config.windowZ,
  };

  const paperGeo = useMemo(
    () => new THREE.BoxGeometry(layerWidth, layerHeight, layerDepth),
    [layerWidth, layerHeight, layerDepth]
  );

  const cutGeo = useMemo(
    () => new THREE.BoxGeometry(1, 1, layerDepth * 6),
    [layerDepth]
  );

  return (
    <group
      position={[
        config.stackX,
        config.stackY + layerHeight * 0.5,
        config.stackZ,
      ]}
      rotation={config.stackRotation}
    >
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
            {baseOffsets.map((baseOffset, j) => {
              const windowTransform = getWindowTransform(
                baseOffset,
                layer,
                config
              );

              return (
                <Subtraction
                  key={`cut-${layer.i}-${j}`}
                  geometry={cutGeo}
                  rotation={[0, 0, windowTransform.zRotation]}
                  position={[windowTransform.x, windowTransform.y, layerZ]}
                  scale={[windowTransform.size, windowTransform.size, 1]}
                />
              );
            })}
          </Geometry>
        </mesh>
      ))}
    </group>
  );
}

function Chips({ config, materials }) {
  const chipGeo = useMemo(
    () => new THREE.BoxGeometry(1, 1, config.layerDepth),
    [config.layerDepth]
  );

  return (
    <group position={[config.chipsX, config.chipsY, config.chipsZ]}>
      <group rotation={[0, config.chipsRotation[1], config.chipsRotation[2]]}>
        <group rotation={[config.chipsPitch + config.chipsRotation[0], 0, 0]}>
          {config.baseOffsets.map((baseOffset, stackIdx) => (
            <group key={`chip-stack-${stackIdx}`}>
              {config.layers.map((layer) => {
                const windowTransform = getWindowTransform(
                  baseOffset,
                  layer,
                  config
                );

                return (
                  <mesh
                    key={`chip-${stackIdx}-${layer.i}`}
                    castShadow
                    receiveShadow
                    geometry={chipGeo}
                    material={materials[layer.i]}
                    position={[windowTransform.x, windowTransform.y, -layer.z]}
                    rotation={[0, 0, windowTransform.zRotation]}
                    scale={[windowTransform.size, windowTransform.size, 1]}
                  />
                );
              })}
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

export default function PaperStack() {
  const config = usePaperStackConfig();

  const materials = useMemo(
    () =>
      COLORS.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c,
            side: THREE.DoubleSide,
            roughness: 0.92,
            metalness: 0,
            envMapIntensity: 0.2,
          })
      ),
    []
  );

  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <ambientLight intensity={1} />
      <PerspectiveCamera
        makeDefault
        position={[-5, 3.5, 12]}
        fov={45}
        onUpdate={(self) => self.lookAt(0, 2, 0)}
      />

      <PresentationControls
        global
        speed={1.15}
        zoom={0.85}
        config={{ mass: 1.2, tension: 220, friction: 28 }}
        rotation={[0, 0, 0]}
        polar={[0, Math.PI / 4]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
      >
        <AccumulativeShadows
          temporal
          frames={config.shadows.accumFrames}
          color={config.shadows.accumColor}
          colorBlend={config.shadows.accumColorBlend}
          opacity={config.shadows.accumOpacity}
          scale={config.shadows.accumScale}
          alphaTest={config.shadows.accumAlphaTest}
          position={config.shadows.accumPosition}
        >
          <RandomizedLight
            amount={config.shadows.lightAmount}
            radius={config.shadows.lightRadius}
            ambient={config.shadows.lightAmbient}
            position={config.shadows.lightPosition}
            bias={config.shadows.lightBias}
          />
        </AccumulativeShadows>

        <Stack config={config} materials={materials} />
        <Chips config={config} materials={materials} />
      </PresentationControls>
    </>
  );
}
