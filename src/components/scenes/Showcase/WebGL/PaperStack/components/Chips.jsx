/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, { useMemo } from 'react';

import getWindowTransform from '../utils/getWindowTransform';

export default function Chips({ config, materials }) {
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
