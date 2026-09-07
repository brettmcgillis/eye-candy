import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { mix, normalView, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// The sphere is the scene's only light source, so it is drawn unlit and its
// rim is brightened rather than darkened — a shaded ball reads as an object
// being lit instead of the thing doing the lighting.
function Sphere({ config, worldRef }) {
  const configRef = useRef(config);
  configRef.current = config;

  const meshRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      core: uniform(new THREE.Color(1, 0.85, 0.6)),
      edge: uniform(new THREE.Color(1, 0.45, 0.15)),
      strength: uniform(2.5),
    }),
    []
  );

  const material = useMemo(() => {
    const nodeMaterial = new THREE.MeshBasicNodeMaterial({
      depthTest: true,
      depthWrite: true,
      toneMapped: false,
    });
    const rim = normalView.z.abs().oneMinus();
    nodeMaterial.colorNode = vec4(
      mix(uniforms.core, uniforms.edge, rim.pow(1.5)).mul(uniforms.strength),
      1
    );
    return nodeMaterial;
  }, [uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const c = configRef.current;
    uniforms.core.value.setStyle(c.sphereCore, THREE.LinearSRGBColorSpace);
    uniforms.edge.value.setStyle(c.sphereEdge, THREE.LinearSRGBColorSpace);
    uniforms.strength.value = c.sphereBrightness;

    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.copy(worldRef.current.position);
    mesh.scale.setScalar(c.sphereRadius * c.worldScale);
  });

  return (
    <mesh frustumCulled={false} material={material} ref={meshRef}>
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  );
}

export default memo(Sphere);
