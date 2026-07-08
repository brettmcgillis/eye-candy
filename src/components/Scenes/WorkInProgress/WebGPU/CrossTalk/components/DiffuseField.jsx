import { Fn, attribute, smoothstep, uniform, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

// Whitewater companion to FluidField: renders the solver's diffuse foam /
// spray / bubble particles as a second, smaller instanced sprite layer in
// the same screen-pixel world space. `bufferRef` holds stride-4
// [x, y, type, fade] records (see useFluidSim) — the type float picks one of
// the three color uniforms on the GPU, and fade drives the age-based
// alpha-out, so recoloring via Leva never touches the buffer and the buffer
// never rebuilds the material.
//
// Same load-bearing quirks as FluidField (see the comments there):
// SpriteNodeMaterial quads instead of THREE.Points, DoubleSide because
// DesktopStage's Y-flipped ortho camera reverses winding, and
// frustumCulled=false because instance positions stream per frame.
function DiffuseField({
  bubbleColor,
  bufferRef,
  countRef,
  foamColor,
  maxParticles,
  size,
  sprayColor,
}) {
  const { mesh, dataAttr, posAttr, uniforms } = useMemo(() => {
    const positions = new THREE.InstancedBufferAttribute(
      new Float32Array(maxParticles * 2),
      2
    );
    positions.setUsage(THREE.DynamicDrawUsage);
    // x = DIFFUSE_* type (0 bubble / 1 foam / 2 spray), y = fade alpha.
    const data = new THREE.InstancedBufferAttribute(
      new Float32Array(maxParticles * 2),
      2
    );
    data.setUsage(THREE.DynamicDrawUsage);

    const geometry = new THREE.InstancedBufferGeometry().copy(
      new THREE.PlaneGeometry(1, 1)
    );
    geometry.instanceCount = 0;
    geometry.setAttribute('aPos', positions);
    geometry.setAttribute('aData', data);

    const bubbleU = uniform(new THREE.Color(bubbleColor));
    const foamU = uniform(new THREE.Color(foamColor));
    const sprayU = uniform(new THREE.Color(sprayColor));
    const sizeU = uniform(size);

    const material = new THREE.SpriteNodeMaterial({
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
    });
    material.positionNode = vec3(attribute('aPos', 'vec2'), 0);
    material.scaleNode = sizeU;
    material.colorNode = Fn(() => {
      const d = uv().sub(0.5).length();
      const mask = smoothstep(0.5, 0.35, d);
      const info = attribute('aData', 'vec2');
      const color = info.x
        .lessThan(0.5)
        .select(bubbleU, info.x.lessThan(1.5).select(foamU, sprayU));
      return vec4(color, mask.mul(info.y).mul(0.9));
    })();

    const particleMesh = new THREE.Mesh(geometry, material);
    particleMesh.frustumCulled = false;

    return {
      dataAttr: data,
      mesh: particleMesh,
      posAttr: positions,
      uniforms: { bubbleU, foamU, sizeU, sprayU },
    };
    // Colors/size are live uniforms below — only a max-count change should
    // rebuild the geometry + pipeline.
  }, [maxParticles]);

  useEffect(() => {
    uniforms.bubbleU.value.set(bubbleColor);
    uniforms.foamU.value.set(foamColor);
    uniforms.sprayU.value.set(sprayColor);
    uniforms.sizeU.value = size;
  }, [uniforms, bubbleColor, foamColor, sprayColor, size]);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    };
  }, [mesh]);

  useFrame(() => {
    const src = bufferRef.current;
    const count = Math.min(
      countRef.current,
      maxParticles,
      Math.floor(src.length / 4)
    );

    // De-interleave the stride-4 sim buffer into the two vec2 attributes.
    const pos = posAttr.array;
    const data = dataAttr.array;
    for (let i = 0; i < count; i += 1) {
      pos[2 * i] = src[4 * i];
      pos[2 * i + 1] = src[4 * i + 1];
      data[2 * i] = src[4 * i + 2];
      data[2 * i + 1] = src[4 * i + 3];
    }
    posAttr.needsUpdate = true;
    dataAttr.needsUpdate = true;
    mesh.geometry.instanceCount = count;
  });

  return <primitive object={mesh} />;
}

export default memo(DiffuseField);
