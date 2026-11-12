import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import useMaterialVariants from '@hooks/useMaterialVariants';
import { modelFile } from '@utils/appUtils';

export default function Skull({
  materialTransform = null,
  showCranium,
  showLeftZygomatic,
  showOccipital,
  showRightLacrimal,
  showRightMaxilla,
  showRightNasal,
  showRightPalatine,
  showRightParietal,
  showRightTemporal,
  showRightZygomatic,
  showSphenoid,
  showTeeth,
  showVomer,
  showEthmoid,
  showFrontal,
  showInferiorConchae,
  showLeftLacrimal,
  showLeftMaxilla,
  showLeftNasal,
  showLeftPalatine,
  showLeftParietal,
  showLeftTemporal,
  showMandible,
  showMandibleBone,
  showMandibleTeeth,
  ...props
}) {
  const { nodes, materials: sourceMaterials } = useGLTF(modelFile(`Skull.glb`));
  const boneSources = useMemo(
    () => ({
      Lower_teeth: sourceMaterials.phong3,
      Mandible: sourceMaterials.lambert5,
      Left_zygomatic: sourceMaterials.lambert5,
      Occipital: sourceMaterials.lambert5,
      Right_lacrimal: sourceMaterials.lambert5,
      Right_max: sourceMaterials.lambert5,
      Right_nasal: sourceMaterials.lambert5,
      Right_palatine: sourceMaterials.lambert5,
      Right_Parietal: sourceMaterials.lambert5,
      Right_temporal: sourceMaterials.lambert5,
      Right_zygomatic: sourceMaterials.lambert5,
      Sphenoid: sourceMaterials.lambert5,
      Teeth: sourceMaterials.phong3,
      Vomer: sourceMaterials.lambert5,
      Ethmoid: sourceMaterials.lambert5,
      Ethmoid_1: sourceMaterials.lambert5,
      Frontal: sourceMaterials.lambert5,
      Inferior_conchae: sourceMaterials.lambert5,
      Left_lacrimal: sourceMaterials.lambert5,
      Left_maxilla: sourceMaterials.lambert5,
      Left_maxilla_1: sourceMaterials.lambert5,
      Left_nasal: sourceMaterials.lambert5,
      Left_palatine: sourceMaterials.lambert5,
      Left_parietal: sourceMaterials.lambert5,
      Left_temporal: sourceMaterials.lambert5,
    }),
    [sourceMaterials]
  );
  const materials = useMaterialVariants(boneSources, materialTransform);

  return (
    <group {...props} dispose={null}>
      <group
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      >
        <group
          position={[-0.418, -1.66, 0.931]}
          rotation={[-0.154, 0.022, 0.045]}
          visible={showMandible}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Lower_teeth.geometry}
            material={materials.Lower_teeth}
            visible={showMandibleTeeth}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Mandible.geometry}
            material={materials.Mandible}
            visible={showMandibleBone}
          />
        </group>
        <group visible={showCranium}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_zygomatic.geometry}
            material={materials.Left_zygomatic}
            visible={showLeftZygomatic}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Occipital.geometry}
            material={materials.Occipital}
            visible={showOccipital}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_lacrimal.geometry}
            material={materials.Right_lacrimal}
            visible={showRightLacrimal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_max.geometry}
            material={materials.Right_max}
            visible={showRightMaxilla}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_nasal.geometry}
            material={materials.Right_nasal}
            visible={showRightNasal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_palatine.geometry}
            material={materials.Right_palatine}
            visible={showRightPalatine}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_Parietal.geometry}
            material={materials.Right_Parietal}
            visible={showRightParietal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_temporal.geometry}
            material={materials.Right_temporal}
            visible={showRightTemporal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_zygomatic.geometry}
            material={materials.Right_zygomatic}
            visible={showRightZygomatic}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Sphenoid.geometry}
            material={materials.Sphenoid}
            visible={showSphenoid}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Teeth.geometry}
            material={materials.Teeth}
            visible={showTeeth}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Vomer.geometry}
            material={materials.Vomer}
            visible={showVomer}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Ethmoid.geometry}
            material={materials.Ethmoid}
            visible={showEthmoid}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Ethmoid_1.geometry}
            material={materials.Ethmoid_1}
            visible={showEthmoid}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Frontal.geometry}
            material={materials.Frontal}
            visible={showFrontal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Inferior_conchae.geometry}
            material={materials.Inferior_conchae}
            visible={showInferiorConchae}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_lacrimal.geometry}
            material={materials.Left_lacrimal}
            visible={showLeftLacrimal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_maxilla.geometry}
            material={materials.Left_maxilla}
            visible={showLeftMaxilla}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_maxilla_1.geometry}
            material={materials.Left_maxilla_1}
            visible={showLeftMaxilla}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_nasal.geometry}
            material={materials.Left_nasal}
            visible={showLeftNasal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_palatine.geometry}
            material={materials.Left_palatine}
            visible={showLeftPalatine}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_parietal.geometry}
            material={materials.Left_parietal}
            visible={showLeftParietal}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_temporal.geometry}
            material={materials.Left_temporal}
            visible={showLeftTemporal}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile(`Skull.glb`));
