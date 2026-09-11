import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import createMountainField, { fieldSignature } from '../utils/mountainField';
import createMountainMaterial from '../utils/mountainMaterial';
import { MOUNTAIN_PALETTES } from './getMountainControls';

// The mountain answers the rain's height query from a baked erosion field, the
// way the ocean answers it from the wave cascades: no geometry is projected into
// a probe, so there is no footprint to crop, no single-highest-surface rule, and
// the detail the drops feel is the field's, not a bake resolution's.
function MountainSurface({ config, onReady }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);
  const signatureRef = useRef(null);
  const { mountain } = config;
  const resolution = mountain.fieldResolution;

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(
      1,
      1,
      mountain.meshResolution,
      mountain.meshResolution
    );
    plane.rotateX(-Math.PI / 2);
    return plane;
  }, [mountain.meshResolution]);

  useEffect(() => {
    if (!gl?.isWebGPURenderer) {
      return undefined;
    }

    const runtime = createMountainField({
      palette: MOUNTAIN_PALETTES,
      resolution,
    });
    const material = createMountainMaterial(runtime);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.frustumCulled = false;
    scene.add(mesh);

    signatureRef.current = null;
    runtimeRef.current = { material, mesh, runtime };
    onReady?.({ probe: runtime.probe });

    return () => {
      runtimeRef.current = null;
      onReady?.(null);
      scene.remove(mesh);
      material.dispose();
      runtime.dispose();
    };
  }, [geometry, gl, onReady, resolution, scene]);

  useFrame(() => {
    const { current } = runtimeRef;
    if (!current) {
      return;
    }

    current.runtime.applyConfig(mountain);
    current.mesh.visible = mountain.visible;

    const signature = fieldSignature(mountain);
    if (signatureRef.current !== signature) {
      signatureRef.current = signature;
      current.runtime.bake(gl);
    }
  });

  return null;
}

export default memo(MountainSurface);
