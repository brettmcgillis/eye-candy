/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, { useMemo } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';
import {
  AccumulativeShadows,
  PerspectiveCamera,
  PresentationControls,
  RandomizedLight,
} from '@react-three/drei';

import usePaperStackControls from './usePaperStackControls';

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
  const config = usePaperStackControls();

  const materials = useMemo(
    () =>
      config.colors.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c,
            side: THREE.DoubleSide,
            roughness: 0.92,
            metalness: 0,
            envMapIntensity: 0.2,
          })
      ),
    [config.colors]
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
