import React from "react";
import { useGLTF } from "@react-three/drei";
import femur from "../models/Femur.gltf";

export function Femur(props) {
  const { nodes, materials } = useGLTF(femur);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh_0.geometry}
        material={materials.material_0}
      />
    </group>
  );
}

useGLTF.preload("/models/Femur.gltf");
