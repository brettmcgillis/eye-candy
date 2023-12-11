import { useControls } from "leva";
import React from "react";
import { useGLTF } from "@react-three/drei";

import skull from "../../../models/Skull.gltf";
import * as _ from "./Skull_Helper";

export function Skull({ ...props }) {
  const { nodes, materials } = useGLTF(skull);

  const controls = useControls(
    "Skull",
    {
      Cranium: _.folderFromObject(_.Cranium),
      Mandible: _.folderFromObject(_.Mandible),
    },
    { collapsed: true }
  );
  return (
    <group {...props} dispose={null}>
      <group
        position={[-0.249, 5.881, 0.961]}
        rotation={[-2.352, 0.002, -0.08]}
      >
        <group
          position={[-0.418, -1.66, 0.931]}
          rotation={[-0.154, 0.022, 0.045]}
          visible={controls[_.Mandible.show_full_mandible]}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Lower_teeth_1.geometry}
            material={materials.phong3}
            visible={controls[_.Mandible.show_mandible_teeth]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Mandible_2.geometry}
            material={materials.lambert5}
            visible={controls[_.Mandible.show_mandible_bone]}
          />
        </group>
        <group visible={controls[_.Cranium.show_cranium]}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_zygomatic_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_zygomatic]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Occipital_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Occipital]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_lacrimal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Right_lacrimal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_max_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Right_max]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_nasal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Right_nasal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_palatine_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Right_palatine]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_Parietal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Right_Parietal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_temporal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Right_temporal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Right_zygomatic_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Right_zygomatic]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Sphenoid_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Sphenoid]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Teeth_1.geometry}
            material={materials.phong3}
            visible={controls[_.Cranium.show_Teeth]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Vomer_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Vomer]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Ethmoid_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Ethmoid]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Ethmoid_2.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Ethmoid]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Frontal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Frontal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Inferior_conchae_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Inferior_conchae]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_lacrimal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_lacrimal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_maxilla_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_maxilla]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_maxilla_2.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_maxilla]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_nasal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_nasal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_palatine_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_palatine]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_parietal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_parietal]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Left_temporal_1.geometry}
            material={materials.lambert5}
            visible={controls[_.Cranium.show_Left_temporal]}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/Skull.gltf");
