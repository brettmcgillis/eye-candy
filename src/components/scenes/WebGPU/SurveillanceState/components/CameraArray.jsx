import React, { memo, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import SurveillanceCamera from './SurveillanceCamera';

function CameraArray({ cameras, feed, sway, standColor }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({ roughness: 0.4, metalness: 0.7 }),
    []
  );
  useEffect(() => {
    material.color.set(standColor);
  }, [material, standColor]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  return cameras.map((camera) => (
    <SurveillanceCamera
      camera={camera}
      feed={feed}
      geometry={geometry}
      key={camera.id}
      material={material}
      sway={sway}
    />
  ));
}

export default memo(CameraArray);
