import React, { memo, useEffect, useMemo } from 'react';

import { mix, smoothstep, uniform, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

function Studio({ config }) {
  const floorMaterial = useMemo(() => {
    const material = new THREE.MeshStandardNodeMaterial({
      metalness: 0,
      roughness: 1,
    });
    const pool = smoothstep(0.04, 0.42, uv().sub(0.5).length());

    material.colorNode = mix(
      uniform(new THREE.Color(config.floorCenterColor)),
      uniform(new THREE.Color(config.floorColor)),
      pool
    );
    return material;
  }, [config.floorCenterColor, config.floorColor]);

  // Open-ended backside cylinder: a seamless cyclorama, bright at the floor
  // line and falling to black overhead so the bolt reads against a gradient
  // rather than a flat void. It must be open-ended and seated on the floor
  // plane — a capped cylinder puts a disc through the middle of the sand, and
  // the top cap is unnecessary because the wall's high colour already matches
  // the scene background.
  const wallMaterial = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      toneMapped: false,
    });
    const height = smoothstep(
      config.wallGradientStart,
      config.wallGradientEnd,
      uv().y
    );

    material.colorNode = mix(
      uniform(new THREE.Color(config.wallLowColor)),
      uniform(new THREE.Color(config.wallHighColor)),
      height
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

  // The plane has to clear the bottom of the sand, not sit inside it — with it
  // buried mid-layer the lower grains were below the floor entirely and could
  // cast neither shadow nor godray occlusion onto it.
  const sandDepth = config.bedThickness + config.bedDuneHeight;
  const floorY = config.bedBaseY - sandDepth - sandDepth * config.floorGapRatio;

  return (
    <group>
      <mesh
        position-y={floorY}
        receiveShadow
        rotation-x={-Math.PI / 2}
        scale={config.roomRadius * 1.02}
      >
        <circleGeometry args={[1, 96]} />
        <primitive attach="material" object={floorMaterial} />
      </mesh>
      <mesh position-y={floorY + config.roomHeight / 2}>
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
