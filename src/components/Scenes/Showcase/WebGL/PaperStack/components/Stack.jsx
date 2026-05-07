/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, { useMemo } from 'react';

import { Base, Geometry, Subtraction } from '@react-three/csg';

import getWindowTransform from '../utils/getWindowTransform';

export default function Stack({ config, materials }) {
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
