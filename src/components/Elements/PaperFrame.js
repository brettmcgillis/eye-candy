import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";

import paperFrame from "../../models/FoldedFrame.glb";

export function PaperFrame(props) {
  const { nodes, materials } = useGLTF(paperFrame);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Frame.geometry}
        material={materials["Material.002"]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload("/FoldedFrame.glb");
