// The dripping skull: real mesh + liquid layers.
//
//   1. Bone — the original GLB meshes and materials, full detail preserved.
//      A wetness control darkens and polishes the bone under the liquid.
//   2. Coat — the same geometry inflated ~1% along its normals with a
//      physical liquid material; a streaky coverage mask slides from
//      "lightly wet" to "fully dipped".
//   3. Drips — marching-cubes metaballs crawling down precomputed runnel
//      paths on the actual mesh surface, pooling and dripping off the chin,
//      teeth and cheekbones. Detached drops fall as instanced spheres.
import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { modelFile } from '@utils/appUtils';

import {
  createCoatMaterial,
  createDripMaterial,
  createLiquidUniforms,
  syncLiquidScalars,
} from '../utils/LiquidMaterial';
import computeRunnelPaths from '../utils/runnelPaths';
import DripsMC from './DripsMC';

useGLTF.preload(modelFile('SkullDecimated.glb'));

const SKULL_HEIGHT = 2.4; // world units
const SKULL_CENTER_Y = 0.6; // matches the camera target area

export default function LiquidSkull({ config, floorY }) {
  const { scene: rawScene } = useGLTF(modelFile('SkullDecimated.glb'));

  const { uniforms, coatMat, dripMat } = useMemo(() => {
    const u = createLiquidUniforms();
    return {
      uniforms: u,
      coatMat: createCoatMaterial(u),
      dripMat: createDripMaterial(u),
    };
  }, []);

  // Normalized clone: bone meshes keep their GLB materials (detail intact),
  // and every mesh gets a coat-shell sibling sharing the same geometry.
  const { skull, boneMaterials, scale } = useMemo(() => {
    const clone = rawScene.clone(true);

    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const ns = SKULL_HEIGHT / size.y;

    const materials = [];
    const shells = [];
    clone.traverse((node) => {
      if (!node.isMesh) return;
      // eslint-disable-next-line no-param-reassign
      node.castShadow = true;

      const mat = node.material;
      if (!materials.includes(mat)) {
        mat.userData.baseRoughness = mat.roughness;
        mat.userData.baseColor = mat.color.clone();
        materials.push(mat);
      }

      const shell = new THREE.Mesh(node.geometry, coatMat);
      shell.renderOrder = 1; // draw after bone for clean alpha blending
      shells.push({ shell, parent: node });
    });
    shells.forEach(({ shell, parent }) => parent.add(shell));

    clone.position.set(
      -center.x * ns,
      SKULL_CENTER_Y - center.y * ns,
      -center.z * ns
    );
    clone.scale.setScalar(ns);
    clone.updateMatrixWorld(true);

    return { skull: clone, boneMaterials: materials, scale: ns };
  }, [rawScene, coatMat]);

  const paths = useMemo(
    () => computeRunnelPaths(skull, { count: 24 }),
    [skull]
  );

  useFrame(() => {
    const u = uniforms;
    u.liquidColor.value.set(config.liquidColor);
    u.emissiveColor.value.set(config.emissiveColor);
    u.emissiveIntensity.value = config.emissiveIntensity;
    u.coverage.value = config.coverage;
    u.coatSoftness.value = config.coatSoftness;
    u.coatThickness.value = config.coatThickness / scale;
    u.streakScale.value = config.streakScale;
    u.streakStretch.value = config.streakStretch;
    u.topBias.value = config.topBias;
    u.flowSpeed.value = config.flowSpeed;
    u.rippleStrength.value = config.rippleStrength;

    syncLiquidScalars(coatMat, config);
    syncLiquidScalars(dripMat, config);

    const wet = config.boneWetness;
    for (let i = 0; i < boneMaterials.length; i += 1) {
      const m = boneMaterials[i];
      m.roughness = m.userData.baseRoughness * (1 - 0.7 * wet);
      m.color
        .copy(m.userData.baseColor)
        .multiplyScalar(1 - 0.3 * wet * config.coverage);
      // Material-level visibility — the coat shells are children of the
      // bone meshes, so toggling node.visible would hide them too.
      m.visible = config.showBone;
    }
  });

  return (
    <>
      <primitive object={skull} />
      <DripsMC
        paths={paths}
        material={dripMat}
        config={config}
        floorY={floorY}
      />
    </>
  );
}
