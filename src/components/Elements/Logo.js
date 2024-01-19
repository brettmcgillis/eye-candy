import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import logo from "../../models/Logo.glb";

export default function Logo({ ...props }) {
  const glowRed = new THREE.MeshBasicMaterial({
    color: new THREE.Color(5, 0, 0),
    toneMapped: false,
    side: THREE.DoubleSide,
  });

  const black = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0, 0, 0),
    side: THREE.DoubleSide,
  });

  const { nodes, materials } = useGLTF(logo);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes["frog-in"].geometry}
        // material={materials["SVGMat.001"]}
        material={glowRed}
        position={[0.835, 0.03, 0.46]}
        scale={[10, 1.018, 10]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes["frog-out"].geometry}
        // material={materials["SVGMat.004"]}
        material={black}
        position={[0.835, 0, 0.46]}
        scale={[10, 1.018, 10]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes["bret-in"].geometry}
        // material={materials["SVGMat.002"]}
        material={glowRed}
        position={[0.038, 0.03, 0.028]}
        scale={[10, 0.524, 10]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes["bret-out"].geometry}
        // material={materials["SVGMat.003"]}
        material={black}
        position={[0.045, 0, 0.099]}
        scale={[10, 0.524, 10]}
      />
    </group>
  );
}

useGLTF.preload("/Logo.glb");
