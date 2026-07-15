import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import buildCloudVoxelField from '../utils/cloudInflator';
import extractCloudMesh from '../utils/marchingCubes';
import createToonCloudMaterial from '../utils/toonCloudMaterial';

const REBUILD_DEBOUNCE_MS = 300;

// A port of ~/dev/examples/clouds's voxel-cloud approach: a Perlin-seeded,
// sphere-splat-"inflated" voxel density field (utils/cloudInflator.js),
// surfaced via marching cubes (utils/marchingCubes.js) into a smooth
// cumulus-silhouette mesh, shaded with a 3-tone dithered toon material
// (utils/toonCloudMaterial.js). Generation is CPU-side JS (matching the
// reference's own Web Worker approach, just on the main thread for
// simplicity) and reruns whenever resolution/seed/inflation/isolation/blur
// change — all structural, since they change the mesh itself.
function pickStructural(config) {
  return {
    resolution: config.voxelCloudResolution,
    seed: config.voxelCloudSeed,
    inflationPasses: config.voxelCloudInflationPasses,
    isolation: config.voxelCloudIsolation,
    blurIntensity: config.voxelCloudBlurIntensity,
  };
}

function VoxelCloud({ config }) {
  const meshRef = useRef(null);
  const uniformsRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);

  const [structural, setStructural] = useState(() => pickStructural(config));
  useEffect(() => {
    const id = setTimeout(() => {
      const next = pickStructural(config);
      setStructural((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    }, REBUILD_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.voxelCloudResolution,
    config.voxelCloudSeed,
    config.voxelCloudInflationPasses,
    config.voxelCloudIsolation,
    config.voxelCloudBlurIntensity,
  ]);

  useEffect(() => {
    const { resolution, seed, inflationPasses, isolation, blurIntensity } =
      structural;

    const field = buildCloudVoxelField({
      size: resolution,
      seed,
      inflationPasses,
    });
    const { positions, normals } = extractCloudMesh({
      field,
      size: resolution,
      isolation,
      blurIntensity,
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    const { material, uniforms } = createToonCloudMaterial({
      baseColor: config.voxelCloudBaseColor,
      shadeColor1: config.voxelCloudShadeColor1,
      shadeColor2: config.voxelCloudShadeColor2,
      lightDirection: new THREE.Vector3(
        config.voxelCloudLightDirection.x,
        config.voxelCloudLightDirection.y,
        config.voxelCloudLightDirection.z
      ),
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    uniformsRef.current = uniforms;
    meshRef.current = mesh;
    setRenderObject(mesh);

    return () => {
      geometry.dispose();
      material.dispose();
      uniformsRef.current = null;
      meshRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structural]);

  useEffect(() => {
    const mesh = meshRef.current;
    const uniforms = uniformsRef.current;
    if (!mesh || !uniforms) {
      return;
    }

    mesh.position.set(
      config.voxelCloudPosition.x,
      config.voxelCloudPosition.y,
      config.voxelCloudPosition.z
    );
    mesh.scale.set(
      config.voxelCloudWidth / 2,
      config.voxelCloudHeight / 2,
      config.voxelCloudDepth / 2
    );

    uniforms.baseColor.value.set(config.voxelCloudBaseColor);
    uniforms.shadeColor1.value.set(config.voxelCloudShadeColor1);
    uniforms.shadeColor2.value.set(config.voxelCloudShadeColor2);
    uniforms.lightDirection.value
      .set(
        config.voxelCloudLightDirection.x,
        config.voxelCloudLightDirection.y,
        config.voxelCloudLightDirection.z
      )
      .normalize();
  }, [
    renderObject,
    config.voxelCloudPosition,
    config.voxelCloudWidth,
    config.voxelCloudHeight,
    config.voxelCloudDepth,
    config.voxelCloudBaseColor,
    config.voxelCloudShadeColor1,
    config.voxelCloudShadeColor2,
    config.voxelCloudLightDirection,
  ]);

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(VoxelCloud);
