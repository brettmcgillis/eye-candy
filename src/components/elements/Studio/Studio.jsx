import React, { memo, useEffect, useMemo } from 'react';

import { mix, smoothstep, uniform, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

// A pooled floor inside an open-ended backside cylinder: a seamless
// cyclorama, bright at the floor line and falling to the background colour
// overhead. Open-ended because a cap would slice through whatever stands in
// the room. Reads the keys getStudioControls declares.
function Studio({ config }) {
  const floorMaterial = useMemo(() => {
    const material = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 1,
    });
    material.colorNode = mix(
      uniform(new THREE.Color(config.floorCenterColor)),
      uniform(new THREE.Color(config.floorColor)),
      smoothstep(0.04, 0.42, uv().sub(0.5).length())
    );
    return material;
  }, [config.floorCenterColor, config.floorColor]);

  const wallMaterial = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      toneMapped: false,
    });
    material.colorNode = mix(
      uniform(new THREE.Color(config.wallLowColor)),
      uniform(new THREE.Color(config.wallHighColor)),
      smoothstep(config.wallGradientStart, config.wallGradientEnd, uv().y)
    );
    return material;
  }, [
    config.wallGradientEnd,
    config.wallGradientStart,
    config.wallHighColor,
    config.wallLowColor,
  ]);

  useEffect(
    () => () => {
      floorMaterial.dispose();
      wallMaterial.dispose();
    },
    [floorMaterial, wallMaterial]
  );

  return (
    <group>
      <mesh
        position-y={config.floorHeight}
        receiveShadow
        rotation-x={-Math.PI / 2}
        scale={config.roomRadius * 1.02}
      >
        <circleGeometry args={[1, 96]} />
        <primitive attach="material" object={floorMaterial} />
      </mesh>
      <mesh position-y={config.floorHeight + config.roomHeight / 2}>
        <cylinderGeometry
          args={[
            config.roomRadius,
            config.roomRadius,
            config.roomHeight,
            96,
            1,
            true,
          ]}
        />
        <primitive attach="material" object={wallMaterial} />
      </mesh>
    </group>
  );
}

export default memo(Studio);
