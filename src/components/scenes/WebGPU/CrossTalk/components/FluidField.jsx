import React, { memo, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { Fn, attribute, smoothstep, uniform, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Renders the shared water body in the same world space DesktopStage/
// CloudField already use (screen pixel coordinates) — the per-window
// "porthole" camera in DesktopStage is what makes each tab only show its own
// slice, exactly like CloudField's clouds. `bufferRef` holds interleaved x,y
// screen-space pairs (host: freshly simulated; non-host: whatever the host
// last broadcast) and `countRef` how many of maxParticles are actually live —
// both refs, not state, so a new frame of water never triggers a React
// re-render (see scene-performance-checklist.md).
//
// Particles are instanced camera-facing quads with a TSL circle mask, not
// THREE.Points: WebGPU has no point-size rasterization, so PointsMaterial's
// `size` is silently ignored and every particle draws as a single pixel.
// Same SpriteNodeMaterial pattern as BurningCash's Embers / TouchGrass's
// FloatingSeeds. The quad is 1×1 and scaleNode is in world units — which in
// DesktopStage's pixel-accurate ortho world means `size` is simply the
// particle's on-screen diameter in pixels.
function FluidField({ bufferRef, color, countRef, maxParticles, size }) {
  const { mesh, posAttr, uniforms } = useMemo(() => {
    const positions = new THREE.InstancedBufferAttribute(
      new Float32Array(maxParticles * 2),
      2
    );
    positions.setUsage(THREE.DynamicDrawUsage);

    const geometry = new THREE.InstancedBufferGeometry().copy(
      new THREE.PlaneGeometry(1, 1)
    );
    geometry.instanceCount = 0;
    geometry.setAttribute('aPos', positions);

    const colorU = uniform(new THREE.Color(color));
    const sizeU = uniform(size);

    // DoubleSide is load-bearing, not belt-and-braces: DesktopStage's
    // pixel-space ortho camera is Y-flipped (top=0, bottom=height), which
    // negates the projection's determinant and reverses triangle winding —
    // with default FrontSide every sprite quad gets backface-culled and the
    // whole water body silently disappears.
    const material = new THREE.SpriteNodeMaterial({
      depthWrite: false,
      side: THREE.DoubleSide,
      transparent: true,
    });
    material.positionNode = vec3(attribute('aPos', 'vec2'), 0);
    material.scaleNode = sizeU;
    material.colorNode = Fn(() => {
      const d = uv().sub(0.5).length();
      // Circle mask with a soft rim so droplets don't alias into hard-edged
      // squares.
      const mask = smoothstep(0.5, 0.4, d);
      return vec4(colorU, mask.mul(0.85));
    })();

    // frustumCulled must be off: instance positions stream in per frame, so
    // three's static bounding volume (computed once from the 1×1 template
    // quad at world origin) never matches where the water actually is — with
    // DesktopStage's -selfRect world offset it sits off-screen and the whole
    // body would be culled before a single particle draws.
    const particleMesh = new THREE.Mesh(geometry, material);
    particleMesh.frustumCulled = false;

    return {
      mesh: particleMesh,
      posAttr: positions,
      uniforms: { colorU, sizeU },
    };
    // color/size are applied via uniforms below — only a Particle Count
    // change should rebuild the geometry + pipeline.
  }, [maxParticles]);

  // Color / Particle Radius are live Leva sliders — retune the existing
  // material in place instead of rebuilding it.
  useEffect(() => {
    uniforms.colorU.value.set(color);
    uniforms.sizeU.value = size;
  }, [uniforms, color, size]);

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
      Math.floor(src.length / 2)
    );

    posAttr.array.set(src.subarray(0, count * 2));
    posAttr.needsUpdate = true;
    mesh.geometry.instanceCount = count;
  });

  return <primitive object={mesh} />;
}

export default memo(FluidField);
