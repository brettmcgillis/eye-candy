/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, { useCallback, useMemo } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';
import {
  AccumulativeShadows,
  OrbitControls,
  PerspectiveCamera,
  RandomizedLight,
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import useSceneAnimation from './useSceneAnimation';
import useSceneControls from './useSceneControls';

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
  const config = useSceneControls();
  const { size } = useThree();

  const aspect = size.width / Math.max(1, size.height);

  // Look at the geometric center of the stack
  const stackCenterY = config.stackY + config.layerHeight * 0.5;

  // Scene bounding estimate: stack spans layerWidth in X, chips extend in Z
  const sceneRadius = Math.max(config.layerWidth / 2, config.chipsZ * 0.8);

  // Fit in the tightest FOV direction (portrait clips horizontally)
  const halfVFov = THREE.MathUtils.degToRad(22.5); // half of 45° vertical FOV
  const halfHFov = Math.atan(Math.tan(halfVFov) * Math.max(0.3, aspect));
  const minHalfFov = Math.min(halfVFov, halfHFov);
  const distance = (sceneRadius / Math.tan(minHalfFov)) * 1.4;

  // Fixed angle: ~30° left of center, ~30° elevated — shows depth, shadows, chips
  const azimuth = THREE.MathUtils.degToRad(-30);
  const elevation = THREE.MathUtils.degToRad(30);

  const cameraX =
    config.stackX + distance * Math.sin(azimuth) * Math.cos(elevation);
  const cameraY = stackCenterY + distance * Math.sin(elevation);
  const cameraZ =
    config.stackZ + distance * Math.cos(azimuth) * Math.cos(elevation);

  const cameraPos = [cameraX, cameraY, cameraZ];
  const orbitTarget = [config.stackX, stackCenterY, config.stackZ];

  const makeMaterials = useCallback(
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

  const stackMaterials = useMemo(makeMaterials, [makeMaterials]);
  const chipsMaterials = useMemo(makeMaterials, [makeMaterials]);

  useSceneAnimation({
    ...config.animation,
    stackMaterials,
    chipsMaterials,
    colors: config.colors,
  });

  return (
    <>
      <color attach="background" args={[config.scene.backgroundColor]} />
      <ambientLight intensity={config.scene.ambientIntensity} />
      <PerspectiveCamera makeDefault position={cameraPos} fov={45} />
      <OrbitControls
        makeDefault
        target={orbitTarget}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />

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
      {config.shadows.lightDebug && (
        <mesh position={config.shadows.lightPosition}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ff0000" wireframe />
        </mesh>
      )}

      <Stack config={config} materials={stackMaterials} />
      <Chips config={config} materials={chipsMaterials} />
    </>
  );
}
