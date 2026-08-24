import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { Fn, smoothstep, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// The single shared ball, positioned imperatively each frame from
// useGravityBall's positionRef (a ref, not state, so a new physics frame
// never triggers a React re-render — see scene-performance-checklist.md).
// Unlike FluidField this is a plain (non-instanced) mesh: there's only ever
// one ball, so its own transform can just be mutated directly instead of
// streaming an instance attribute.
function GravityBall({ color, positionRef, radius }) {
  const meshRef = useRef(null);

  const { material, uniforms } = useMemo(() => {
    const colorU = uniform(new THREE.Color(color));
    // DoubleSide is load-bearing: DesktopStage's pixel-space ortho camera
    // is Y-flipped (top=0, bottom=height), which reverses triangle winding
    // — with default FrontSide the sprite would be backface-culled and
    // invisible (see FluidField.jsx for the same reasoning).
    const mat = new THREE.SpriteNodeMaterial({
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
    });
    mat.colorNode = Fn(() => {
      const d = uv().sub(0.5).length();
      const mask = smoothstep(0.5, 0.42, d);
      return vec4(colorU, mask);
    })();
    return { material: mat, uniforms: { colorU } };
  }, []);

  useEffect(() => {
    uniforms.colorU.value.set(color);
  }, [uniforms, color]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pos = positionRef.current;
    mesh.position.set(pos.x, pos.y, 0);
    mesh.scale.setScalar(radius * 2);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export default memo(GravityBall);
