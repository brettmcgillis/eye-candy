import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function House(props) {
  const { nodes, materials } = useGLTF(modelFile('house.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Angle1_Details_0.geometry}
        material={materials.Details}
        position={[3.925, 2.22, 0.105]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Angle2_Details_0.geometry}
        material={materials.Details}
        position={[1.953, 2.213, 3.109]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Angle3_Details_0.geometry}
        material={materials.Details}
        position={[-4.151, 2.202, 3.109]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Angle4_Details_0.geometry}
        material={materials.Details}
        position={[3.928, 2.2, -2.911]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Angle5_Details_0.geometry}
        material={materials.Details}
        position={[-4.152, 2.201, -2.91]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Angle6_Details_0.geometry}
        material={materials.Details}
        position={[3.921, 2.152, 3.104]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Angle7_Details_0.geometry}
        material={materials.Details}
        position={[3.449, 3.68, 2.377]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Base_Base_0.geometry}
        material={materials.Base}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Border1_Details_0.geometry}
        material={materials.Details}
        position={[3.525, 1.411, 3.104]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Border2_Details_0.geometry}
        material={materials.Details}
        position={[3.922, 1.379, 1.614]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cube_bridge_0.geometry}
        material={materials.bridge}
        position={[2.657, 0, 3.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_Details_0.geometry}
        material={materials.Details}
        position={[3.44, 0.72, 0.099]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.DoorOut_Details_0.geometry}
        material={materials.Details}
        position={[3.44, 0.72, 0.099]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Down1_Base_0.geometry}
        material={materials.Base}
        position={[0, 0.566, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Down2_Base_0.geometry}
        material={materials.Base}
        position={[0, 3.765, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tube_Up_0.geometry}
        material={materials.material}
        position={[1.53, 0, -3.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Up_Up_0.geometry}
        material={materials.material}
        position={[-1.103, 6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall1_Walls_0.geometry}
        material={materials.Walls}
        position={[-1.18, 0.44, 3.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall2_Walls_0.geometry}
        material={materials.Walls}
        position={[3.92, 0.44, -1.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall3_Walls_0.geometry}
        material={materials.Walls}
        position={[-4.14, 0.44, 0.06]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall4_Walls_0.geometry}
        material={materials.Walls}
        position={[-1.18, 0.44, -2.9]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall5_Walls_0.geometry}
        material={materials.Walls}
        position={[2.42, 0.44, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall6_Walls_0.geometry}
        material={materials.Walls}
        position={[1.94, 0.44, 1.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WallsIn_Base_0.geometry}
        material={materials.Base}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut_Details_0.geometry}
        material={materials.Details}
        position={[0.162, 1.22, 3.103]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut001_Details_0.geometry}
        material={materials.Details}
        position={[-2.437, 1.22, 3.103]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut002_Details_0.geometry}
        material={materials.Details}
        position={[-1.138, 4.45, 3.103]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut003_Details_0.geometry}
        material={materials.Details}
        position={[-4.144, 1.22, 1.546]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut004_Details_0.geometry}
        material={materials.Details}
        position={[-4.144, 1.22, -1.416]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut005_Details_0.geometry}
        material={materials.Details}
        position={[-1.246, 1.22, -2.899]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut006_Details_0.geometry}
        material={materials.Details}
        position={[-1.074, 4.449, -2.899]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOut007_Details_0.geometry}
        material={materials.Details}
        position={[3.924, 1.22, -1.361]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown_Details_0.geometry}
        material={materials.Details}
        position={[0.195, 1.642, 3.148]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown001_Details_0.geometry}
        material={materials.Details}
        position={[-2.404, 1.642, 3.148]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown002_Details_0.geometry}
        material={materials.Details}
        position={[-1.104, 4.872, 3.148]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown003_Details_0.geometry}
        material={materials.Details}
        position={[-4.189, 1.642, 1.579]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown004_Details_0.geometry}
        material={materials.Details}
        position={[-4.189, 1.642, -1.383]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown005_Details_0.geometry}
        material={materials.Details}
        position={[-1.279, 1.642, -2.943]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown006_Details_0.geometry}
        material={materials.Details}
        position={[-1.107, 4.871, -2.943]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown007_Details_0.geometry}
        material={materials.Details}
        position={[3.969, 1.642, -1.394]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown_Opacity_0.geometry}
        material={materials.Opacity}
        position={[0.195, 1.642, 3.148]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown001_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-2.404, 1.642, 3.148]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown002_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-1.104, 4.872, 3.148]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown003_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-4.189, 1.642, 1.579]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown004_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-4.189, 1.642, -1.383]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown005_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-1.279, 1.642, -2.943]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown006_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-1.107, 4.871, -2.943]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowOutDown007_Opacity_0.geometry}
        material={materials.Opacity}
        position={[3.969, 1.642, -1.394]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo_Details_0.geometry}
        material={materials.Details}
        position={[0.195, 2.277, 3.17]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo001_Details_0.geometry}
        material={materials.Details}
        position={[-2.404, 2.277, 3.17]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo002_Details_0.geometry}
        material={materials.Details}
        position={[-1.104, 5.507, 3.17]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo003_Details_0.geometry}
        material={materials.Details}
        position={[-4.211, 2.277, 1.579]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo004_Details_0.geometry}
        material={materials.Details}
        position={[-4.211, 2.277, -1.383]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo005_Details_0.geometry}
        material={materials.Details}
        position={[-1.279, 2.277, -2.966]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo006_Details_0.geometry}
        material={materials.Details}
        position={[-1.107, 5.506, -2.966]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo007_Details_0.geometry}
        material={materials.Details}
        position={[3.991, 2.277, -1.394]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo_Opacity_0.geometry}
        material={materials.Opacity}
        position={[0.195, 2.277, 3.17]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo001_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-2.404, 2.277, 3.17]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo002_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-1.104, 5.507, 3.17]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo003_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-4.211, 2.277, 1.579]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo004_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-4.211, 2.277, -1.383]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo005_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-1.279, 2.277, -2.966]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo006_Opacity_0.geometry}
        material={materials.Opacity}
        position={[-1.107, 5.506, -2.966]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={2}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.WindowUo007_Opacity_0.geometry}
        material={materials.Opacity}
        position={[3.991, 2.277, -1.394]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={2}
      />
    </group>
  );
}

useGLTF.preload(modelFile('house.glb'));
