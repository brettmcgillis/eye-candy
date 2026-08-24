import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function PhotoStudio(props) {
  const { nodes, materials } = useGLTF(modelFile('photo_studio.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Backdrop_1_Studio_Setup_Mtl_1001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_1.001']}
        position={[-1.382, 2.2, -0.004]}
        rotation={[0, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Backdrop_Axis_1_Studio_Setup_Mtl_1001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_1.001']}
        position={[-1.382, 2.2, -0.004]}
        rotation={[0, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Backdrop_Axis_1_Studio_Setup_Mtl_4001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_4.001']}
        position={[-1.382, 2.2, -0.004]}
        rotation={[0, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Backdrop_Axis_1_Studio_Setup_Mtl_5001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_5.001']}
        position={[-1.382, 2.2, -0.004]}
        rotation={[0, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_1_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.585, 0.831, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_2_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.585, 0.831, 0.713]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_3_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.585, 0.831, -0.726]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_4_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.002, 0.831, -0.726]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_5_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.002, 0.831, 0.179]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_6_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.002, 0.831, 0.877]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_7_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[2.903, -1.023, -0.971]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_8_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.545, -1.266, -1.469]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Cable_9_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.124, -1.493, 1.728]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Ceiling_Studio_Setup_Mtl_19001_0.geometry}
        material={materials['Studio_Setup_Mtl_19.001']}
        position={[1.585, 3, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Curtain_1_Studio_Fabric_3_0.geometry}
        material={materials.Studio_Fabric_3}
        position={[-3.276, 0, -2.454]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={0.652}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Curtain_2_Studio_Fabric_3_0.geometry}
        material={materials.Studio_Fabric_3}
        position={[-3.208, 0, 2.448]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={0.652}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Curtain_3001_Studio_Fabric_3_0.geometry}
        material={materials.Studio_Fabric_3}
        position={[-0.852, 0, -4.834]}
        rotation={[Math.PI, 0, Math.PI]}
        scale={0.652}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Curtain_8_Studio_Fabric_3_0.geometry}
        material={materials.Studio_Fabric_3}
        position={[-0.845, 0, 4.836]}
        scale={0.652}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Floor001_Studio_Plastic_1_0.geometry}
        material={materials.Studio_Plastic_1}
        position={[1.585, 0, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_1_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.572, -0.027]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_2_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.572, 0.686]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_3_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.572, -0.753]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_4_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.572, -0.753]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_5_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.572, 0.151]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_6_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.572, 0.85]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_7_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.293, 1.699, -2.202]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_8_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.283, 1.392, 1.51]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_9_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.446, 1.391, -1.354]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Handle_10_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.442, 0.024, -2.496]}
        rotation={[0.547, -1.467, -0.221]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_9_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.967, 2.596, -0.054]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_8_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.947, 2.495, -0.008]}
        rotation={[0, 0.093, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_7_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.954, 2.341, 0.065]}
        rotation={[0, 0.093, 0.225]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_45_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.967, 2.596, 0.659]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_40_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.933, 2.495, 0.701]}
        rotation={[0, -0.711, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_36_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.885, 2.341, 0.756]}
        rotation={[0, -0.711, 0.225]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_46_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.967, 2.596, -0.779]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_41_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.962, 2.495, -0.742]}
        rotation={[0, 1.006, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_35_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.024, 2.341, -0.703]}
        rotation={[0, 1.006, 0.012]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_47_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.797, 2.596, -0.779]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_42_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.807, 2.495, -0.768]}
        rotation={[Math.PI, 0.669, 2.708]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_37_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.762, 2.341, -0.825]}
        rotation={[-Math.PI, 0.669, -2.76]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_48_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.797, 2.596, 0.125]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_43_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.808, 2.495, 0.136]}
        rotation={[Math.PI, 0.595, 2.708]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_38_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.767, 2.341, 0.075]}
        rotation={[Math.PI, 0.595, 2.86]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_49_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.797, 2.596, 0.823]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_44_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.817, 2.495, 0.831]}
        rotation={[Math.PI, 0.118, 2.708]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_39_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.808, 2.341, 0.758]}
        rotation={[Math.PI, 0.118, -3.107]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_2_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.293, 0.221, -2.242]}
        rotation={[Math.PI, -0.015, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_1_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.293, 0.5, -2.245]}
        rotation={[Math.PI, -0.015, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_5_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.318, 1.723, -2.215]}
        rotation={[-0.069, 1.355, 0.061]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_6_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.315, 1.691, -2.202]}
        rotation={[-0.069, 1.355, 0.061]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_10_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.355, 0.221, 1.708]}
        rotation={[0, 0.76, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_11_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.354, 0.5, 1.71]}
        rotation={[0, 0.76, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_14_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.358, 0.207, -1.709]}
        rotation={[0, 0.686, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_15_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.357, 0.504, -1.707]}
        rotation={[0, 0.686, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_18_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.317, 0.19, 1.532]}
        rotation={[0, 1.024, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_19_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.319, 0.514, 1.534]}
        rotation={[0, 1.024, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_29_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.278, 1.415, 1.54]}
        rotation={[0, -0.769, -0.13]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_32_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.268, 1.382, 1.53]}
        rotation={[0, -0.769, -0.13]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_50_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.473, 0.515, -1.323]}
        rotation={[0, 0.718, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_23_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.472, 0.189, -1.325]}
        rotation={[0, 0.718, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_30_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.478, 1.411, -1.351]}
        rotation={[0, 0.718, -0.231]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_33_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.462, 1.382, -1.337]}
        rotation={[0, 0.718, -0.231]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_24_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.633, 0.11, -2.638]}
        rotation={[-2.596, -0.104, 1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_22_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.109, 0.084, -2.592]}
        rotation={[-2.596, -0.104, 1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_31_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.424, 0.058, -2.497]}
        rotation={[-0.804, 0.023, 1.238]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_34_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.452, 0.042, -2.481]}
        rotation={[-0.804, 0.023, 1.238]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_9_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.967, 2.596, -0.054]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_8_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.947, 2.495, -0.008]}
        rotation={[0, 0.093, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_7_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.954, 2.341, 0.065]}
        rotation={[0, 0.093, 0.225]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_45_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.967, 2.596, 0.659]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_40_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.933, 2.495, 0.701]}
        rotation={[0, -0.711, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_36_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.885, 2.341, 0.756]}
        rotation={[0, -0.711, 0.225]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_46_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.967, 2.596, -0.779]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_41_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.962, 2.495, -0.742]}
        rotation={[0, 1.006, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_35_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.024, 2.341, -0.703]}
        rotation={[0, 1.006, 0.012]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_47_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.797, 2.596, -0.779]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_42_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.807, 2.495, -0.768]}
        rotation={[Math.PI, 0.669, 2.708]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_37_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.762, 2.341, -0.825]}
        rotation={[-Math.PI, 0.669, -2.76]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_48_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.797, 2.596, 0.125]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_43_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.808, 2.495, 0.136]}
        rotation={[Math.PI, 0.595, 2.708]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_38_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.767, 2.341, 0.075]}
        rotation={[Math.PI, 0.595, 2.86]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_49_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.797, 2.596, 0.823]}
        rotation={[0, 1.57, -0.434]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_44_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.817, 2.495, 0.831]}
        rotation={[Math.PI, 0.118, 2.708]}
        scale={0.534}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_39_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.808, 2.341, 0.758]}
        rotation={[Math.PI, 0.118, -3.107]}
        scale={0.815}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_2_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.293, 0.221, -2.242]}
        rotation={[Math.PI, -0.015, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_1_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.293, 0.5, -2.245]}
        rotation={[Math.PI, -0.015, Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_5_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.318, 1.723, -2.215]}
        rotation={[-0.069, 1.355, 0.061]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_6_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.315, 1.691, -2.202]}
        rotation={[-0.069, 1.355, 0.061]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_10_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.355, 0.221, 1.708]}
        rotation={[0, 0.76, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_11_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.354, 0.5, 1.71]}
        rotation={[0, 0.76, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_14_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.358, 0.207, -1.709]}
        rotation={[0, 0.686, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_15_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.357, 0.504, -1.707]}
        rotation={[0, 0.686, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_18_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.317, 0.19, 1.532]}
        rotation={[0, 1.024, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_19_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.319, 0.514, 1.534]}
        rotation={[0, 1.024, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_29_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.278, 1.415, 1.54]}
        rotation={[0, -0.769, -0.13]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_32_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.268, 1.382, 1.53]}
        rotation={[0, -0.769, -0.13]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_50_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.473, 0.515, -1.323]}
        rotation={[0, 0.718, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_23_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.472, 0.189, -1.325]}
        rotation={[0, 0.718, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_30_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.478, 1.411, -1.351]}
        rotation={[0, 0.718, -0.231]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_33_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.462, 1.382, -1.337]}
        rotation={[0, 0.718, -0.231]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_24_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.633, 0.11, -2.638]}
        rotation={[-2.596, -0.104, 1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_22_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.109, 0.084, -2.592]}
        rotation={[-2.596, -0.104, 1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_31_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.424, 0.058, -2.497]}
        rotation={[-0.804, 0.023, 1.238]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_34_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.452, 0.042, -2.481]}
        rotation={[-0.804, 0.023, 1.238]}
        scale={0.553}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_1_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.028, 2.401, 0.009]}
        rotation={[-1.69, 0.906, 1.722]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_2_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.977, 2.401, 0.77]}
        rotation={[-0.87, 0.642, 0.618]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_3_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.03, 2.383, -0.805]}
        rotation={[-2.626, 0.504, 2.874]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_4_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.846, 2.413, -0.828]}
        rotation={[-2.1, -0.568, -2.398]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_5_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.876, 2.356, 0.061]}
        rotation={[-2.875, -0.959, -2.921]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_6_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.902, 2.385, 0.797]}
        rotation={[-1.799, -1.088, -1.828]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_8_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.352, 1.847, -2.285]}
        rotation={[-2.707, 0.188, 2.509]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_9_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.341, 1.531, 1.624]}
        rotation={[-0.424, 0.755, 2.161]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_7_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.574, 1.519, -1.413]}
        rotation={[-2.838, 0.83, 2.64]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_1_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.028, 2.401, 0.009]}
        rotation={[-1.69, 0.906, 1.722]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_2_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.977, 2.401, 0.77]}
        rotation={[-0.87, 0.642, 0.618]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_3_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.03, 2.383, -0.805]}
        rotation={[-2.626, 0.504, 2.874]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_4_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.846, 2.413, -0.828]}
        rotation={[-2.1, -0.568, -2.398]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_5_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.876, 2.356, 0.061]}
        rotation={[-2.875, -0.959, -2.921]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_6_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.902, 2.385, 0.797]}
        rotation={[-1.799, -1.088, -1.828]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_8_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.352, 1.847, -2.285]}
        rotation={[-2.707, 0.188, 2.509]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_9_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.341, 1.531, 1.624]}
        rotation={[-0.424, 0.755, 2.161]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Connector_7_Studio_Setup_Mtl_7001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.574, 1.519, -1.413]}
        rotation={[-2.838, 0.83, 2.64]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_2_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-1.499, -0.655, -3.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_6_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-2.039, -0.482, 2.314]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_7_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-1.187, -0.233, -2.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_8_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-0.988, 0.608, -0.856]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_9_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-1.485, 0.126, -0.6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_10_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-1.511, 0.465, -0.132]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_2_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-1.499, -0.655, -3.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_6_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-2.039, -0.482, 2.314]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_7_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-1.187, -0.233, -2.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_8_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-0.988, 0.608, -0.856]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_9_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-1.485, 0.126, -0.6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_10_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-1.511, 0.465, -0.132]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_2_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-1.499, -0.655, -3.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_6_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-2.039, -0.482, 2.314]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_7_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-1.187, -0.233, -2.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_8_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-0.988, 0.608, -0.856]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_9_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-1.485, 0.126, -0.6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_10_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-1.511, 0.465, -0.132]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_2_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-1.499, -0.655, -3.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_6_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-2.039, -0.482, 2.314]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_7_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-1.187, -0.233, -2.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_8_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-0.988, 0.608, -0.856]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_9_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-1.485, 0.126, -0.6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_10_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-1.511, 0.465, -0.132]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_2_Studio_Setup_Mtl_18001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_18.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-1.499, -0.655, -3.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_6_Studio_Setup_Mtl_18001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_18.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-2.039, -0.482, 2.314]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_7_Studio_Setup_Mtl_18001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_18.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-1.187, -0.233, -2.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_8_Studio_Setup_Mtl_18001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_18.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-0.988, 0.608, -0.856]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_9_Studio_Setup_Mtl_18001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_18.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-1.485, 0.126, -0.6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_10_Studio_Setup_Mtl_18001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_18.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-1.511, 0.465, -0.132]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_2_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-1.499, -0.655, -3.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_6_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-2.039, -0.482, 2.314]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_7_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-1.187, -0.233, -2.09]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_8_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-0.988, 0.608, -0.856]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_9_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-1.485, 0.126, -0.6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_10_Studio_Setup_Mtl_6001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-1.511, 0.465, -0.132]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Arm_1_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-Math.PI / 2, 0, -3.048]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Arm_2_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-Math.PI / 2, 0, 2.431]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Arm_3_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-Math.PI / 2, 0, -2.136]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Arm_4_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-Math.PI / 2, 0, -0.669]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Arm_5_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-Math.PI / 2, 0, -0.595]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Arm_6_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-Math.PI / 2, 0, -0.118]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_1_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_2_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_3_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_4_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_5_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_6_Studio_Setup_Mtl_3001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_1_Studio_Setup_Mtl_6001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.946, 2.341, -0.027]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_2_Studio_Setup_Mtl_6001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.946, 2.341, 0.686]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_3_Studio_Setup_Mtl_6001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.946, 2.341, -0.752]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_4_Studio_Setup_Mtl_6001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.819, 2.341, -0.753]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_5_Studio_Setup_Mtl_6001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.819, 2.341, 0.152]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Ceiling_Tube_6_Studio_Setup_Mtl_6001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.819, 2.341, 0.85]}
        rotation={[-Math.PI / 2, 0, -1.572]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Rail_1_Studio_Setup_Mtl_5001_0.geometry}
        material={materials['Studio_Setup_Mtl_5.001']}
        position={[0.946, 2.601, -0.027]}
        rotation={[-Math.PI / 2, 0, 3.141]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Rail_2_Studio_Setup_Mtl_5001_0.geometry}
        material={materials['Studio_Setup_Mtl_5.001']}
        position={[-0.819, 2.601, -0.027]}
        rotation={[-Math.PI / 2, 0, 3.141]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Rail_1_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.946, 2.601, -0.027]}
        rotation={[-Math.PI / 2, 0, 3.141]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Rail_2_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-0.819, 2.601, -0.027]}
        rotation={[-Math.PI / 2, 0, 3.141]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_1_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.738, 2.994, -0.25]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_2_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.738, 2.994, 0.463]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_3_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.738, 2.994, -0.976]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_4_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.465, 2.994, -0.941]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_5_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.455, 2.994, -0.218]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_6_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-0.455, 2.994, 0.463]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_1_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[0.738, 3.001, -0.25]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_2_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[0.738, 3.001, 0.463]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_3_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[0.738, 3.001, -0.976]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_4_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[-0.465, 3.001, -0.941]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_5_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[-0.454, 3.001, -0.218]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_6_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[-0.454, 3.001, 0.463]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_7_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[2.201, -0.011, -3.281]}
        rotation={[-Math.PI / 2, 0, -1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_8_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[2.106, -0.011, -3.282]}
        rotation={[-Math.PI / 2, 0, -1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Socket_9_Studio_Setup_Mtl_12001_0.geometry}
        material={materials['Studio_Setup_Mtl_12.001']}
        position={[2.403, -0.011, 4.273]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_7_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[2.201, -0.005, -3.281]}
        rotation={[-Math.PI / 2, 0, -1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_8_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[2.106, -0.005, -3.281]}
        rotation={[-Math.PI / 2, 0, -1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Plug_9_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[2.403, -0.004, 4.273]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_4_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.208, 0, -2.214]}
        rotation={[-Math.PI / 2, 0, -2.967]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_5_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_3_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_1_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_4_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[1.208, 0, -2.214]}
        rotation={[-Math.PI / 2, 0, -2.967]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_5_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_3_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_1_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_4_Studio_Setup_Mtl_14001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_14.001']}
        position={[1.208, 0, -2.214]}
        rotation={[-Math.PI / 2, 0, -2.967]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_5_Studio_Setup_Mtl_14001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_14.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_3_Studio_Setup_Mtl_14001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_14.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_1_Studio_Setup_Mtl_14001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_14.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_4_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[1.208, 0, -2.214]}
        rotation={[-Math.PI / 2, 0, -2.967]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_5_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_3_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_1_Studio_Setup_Mtl_15001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_15.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_4_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[1.208, 0, -2.214]}
        rotation={[-Math.PI / 2, 0, -2.967]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_5_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_3_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_1_Studio_Setup_Mtl_17001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_17.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_4_Studio_Setup_Mtl_18001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_18.001']}
        position={[1.208, 0, -2.214]}
        rotation={[-Math.PI / 2, 0, -2.967]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_1_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.294, 0.223, -2.167]}
        rotation={[-1.738, -0.003, -3.126]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_2_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.262, 0.223, -2.22]}
        rotation={[-1.489, 0.146, 1.057]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_3_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.324, 0.223, -2.221]}
        rotation={[-1.484, -0.144, -1.026]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_4_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.407, 0.223, 1.653]}
        rotation={[-1.449, 0.115, 0.753]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_5_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.348, 0.223, 1.671]}
        rotation={[-1.531, -0.163, -1.331]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_6_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.393, 0.223, 1.713]}
        rotation={[-1.731, 0.047, 2.858]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_7_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.405, 0.209, -1.767]}
        rotation={[-1.383, 0.152, 0.672]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_8_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.348, 0.209, -1.745]}
        rotation={[-1.531, -0.238, -1.403]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_9_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.395, 0.209, -1.706]}
        rotation={[-1.797, 0.084, 2.79]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_10_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.253, 0.191, 1.493]}
        rotation={[-1.385, 0.294, 0.996]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_11_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.315, 0.191, 1.494]}
        rotation={[-1.399, -0.303, -1.044]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_12_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.283, 0.191, 1.547]}
        rotation={[-1.917, 0.008, 3.12]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_13_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.423, 0.191, -1.382]}
        rotation={[-1.303, 0.227, 0.688]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_15_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.481, 0.191, -1.362]}
        rotation={[-1.5, -0.343, -1.364]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_17_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.435, 0.191, -1.321]}
        rotation={[-1.903, 0.111, 2.831]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_14_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.639, 0.071, -2.574]}
        rotation={[-2.596, -0.394, 1.571]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_16_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.633, 0.073, -2.635]}
        rotation={[-0.478, -0.237, 1.664]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Arm_18_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.633, 0.125, -2.603]}
        rotation={[1.569, -0.236, 1.478]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_2_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.276, 0.223, -2.166]}
        rotation={[0, -1.555, Math.PI / 3]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_3_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.314, 0.258, -1.958]}
        rotation={[3.142, 1.555, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_4_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.279, 0.259, -1.956]}
        rotation={[0, -1.555, Math.PI / 3]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_91_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.311, 0.223, -2.166]}
        rotation={[Math.PI, 1.555, -Math.PI / 6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_5_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.253, 0.223, -2.205]}
        rotation={[0, -0.508, Math.PI / 3]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_6_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.269, 0.223, -2.236]}
        rotation={[-Math.PI, 0.508, 2.475]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_7_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.086, 0.258, -2.338]}
        rotation={[Math.PI, 0.508, 2.475]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_8_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.071, 0.258, -2.307]}
        rotation={[0, -0.508, Math.PI / 3]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_10_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.495, 0.258, -2.344]}
        rotation={[Math.PI, -0.539, -2.238]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_11_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.334, 0.223, -2.207]}
        rotation={[0, 0.539, 2.618]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_12_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.315, 0.223, -2.236]}
        rotation={[Math.PI, -0.539, 2.475]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_9_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.512, 0.259, -2.314]}
        rotation={[0, 0.539, 2.618]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_13_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.334, 0.499, -2.208]}
        rotation={[0.002, 0.568, 2.616]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_14_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.31, 0.5, -2.165]}
        rotation={[-0.107, 1.557, 2.724]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_15_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.277, 0.499, -2.163]}
        rotation={[0.033, -1.526, 2.65]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_16_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.252, 0.499, -2.207]}
        rotation={[-0.002, -0.537, 2.616]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_17_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.266, 0.5, -2.237]}
        rotation={[3.14, 0.479, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_18_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.318, 0.5, -2.237]}
        rotation={[-3.14, -0.51, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_113_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.276, 1.696, -2.209]}
        rotation={[3.073, -1.355, -2.589]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_19_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.395, 0.223, 1.641]}
        rotation={[Math.PI, 0.811, -2.094]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_20_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.42, 0.223, 1.665]}
        rotation={[0, -0.811, 2.618]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_21_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.564, 0.258, 1.513]}
        rotation={[0, -0.811, 2.618]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_22_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.54, 0.259, 1.488]}
        rotation={[Math.PI, 0.811, -2.094]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_23_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.351, 0.223, 1.654]}
        rotation={[Math.PI, -0.236, -2.094]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_24_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.343, 0.223, 1.688]}
        rotation={[0, 0.236, -0.667]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_25_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.139, 0.258, 1.638]}
        rotation={[0, 0.236, -0.667]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_26_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.148, 0.258, 1.605]}
        rotation={[Math.PI, -0.236, -2.094]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_27_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.469, 0.259, 1.909]}
        rotation={[Math.PI, -1.283, -Math.PI / 6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_28_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.435, 0.258, 1.92]}
        rotation={[0, 1.283, 0.904]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_29_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.41, 0.223, 1.709]}
        rotation={[Math.PI, -1.283, -Math.PI / 6]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_30_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.376, 0.223, 1.718]}
        rotation={[0, 1.283, -0.667]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_31_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.409, 0.499, 1.711]}
        rotation={[3.136, -1.312, -0.53]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_32_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.421, 0.5, 1.663]}
        rotation={[-0.002, -0.84, 2.616]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_33_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.398, 0.499, 1.639]}
        rotation={[3.14, 0.782, -0.523]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_34_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.35, 0.499, 1.654]}
        rotation={[-3.14, -0.207, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_35_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.339, 0.5, 1.686]}
        rotation={[0.002, 0.265, 2.617]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_36_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.378, 0.5, 1.721]}
        rotation={[-0.005, 1.254, 2.622]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_37_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.419, 0.209, -1.757]}
        rotation={[0, -0.885, 2.545]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_38_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.392, 0.209, -1.779]}
        rotation={[Math.PI, 0.885, -2.021]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_39_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.55, 0.26, -1.916]}
        rotation={[0, -0.885, 2.545]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_40_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.523, 0.26, -1.939]}
        rotation={[Math.PI, 0.885, -2.021]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_41_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.35, 0.209, -1.763]}
        rotation={[Math.PI, -0.163, -2.168]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_42_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.344, 0.209, -1.728]}
        rotation={[0, 0.163, -0.594]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_43_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.14, 0.26, -1.762]}
        rotation={[0, 0.163, -0.594]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_44_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.147, 0.26, -1.796]}
        rotation={[Math.PI, -0.163, -2.168]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_45_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.484, 0.26, -1.519]}
        rotation={[Math.PI, -1.21, -0.45]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_46_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.452, 0.26, -1.506]}
        rotation={[0, 1.21, 0.83]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_47_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.412, 0.209, -1.711]}
        rotation={[Math.PI, -1.21, -0.45]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_48_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.379, 0.209, -1.7]}
        rotation={[0, 1.21, -0.74]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_49_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.412, 0.503, -1.71]}
        rotation={[3.137, -1.239, -0.529]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_50_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.42, 0.505, -1.758]}
        rotation={[-0.002, -0.914, 2.615]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_51_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.395, 0.503, -1.78]}
        rotation={[3.139, 0.856, -0.523]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_52_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.348, 0.504, -1.762]}
        rotation={[-3.14, -0.134, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_53_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.34, 0.505, -1.73]}
        rotation={[0.001, 0.192, 2.617]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_54_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.381, 0.505, -1.697]}
        rotation={[-0.004, 1.181, 2.621]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_55_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.243, 0.192, 1.507]}
        rotation={[0, -0.547, 2.439]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_56_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.262, 0.192, 1.477]}
        rotation={[Math.PI, 0.547, -1.915]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_57_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.073, 0.264, 1.403]}
        rotation={[0, -0.547, 2.439]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_58_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.091, 0.265, 1.373]}
        rotation={[Math.PI, 0.547, -1.915]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_59_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.307, 0.192, 1.478]}
        rotation={[Math.PI, -0.5, -2.274]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_60_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.324, 0.192, 1.509]}
        rotation={[0, 0.5, -0.488]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_61_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.5, 0.264, 1.413]}
        rotation={[0, 0.5, -0.488]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_62_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.482, 0.264, 1.383]}
        rotation={[Math.PI, -0.5, -2.274]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_63_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.261, 0.264, 1.746]}
        rotation={[3.142, -1.547, -0.344]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_64_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.296, 0.264, 1.747]}
        rotation={[0, 1.547, 0.725]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_65_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.265, 0.192, 1.547]}
        rotation={[-Math.PI, -1.547, -0.344]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_66_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.3, 0.192, 1.547]}
        rotation={[0, 1.547, -0.846]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_67_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.266, 0.513, 1.549]}
        rotation={[0.26, -1.565, 2.877]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_68_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.243, 0.515, 1.505]}
        rotation={[-0.002, -0.576, 2.616]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_69_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.259, 0.513, 1.476]}
        rotation={[3.14, 0.518, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_70_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.309, 0.514, 1.479]}
        rotation={[-3.14, -0.471, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_71_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.327, 0.515, 1.506]}
        rotation={[0.002, 0.529, 2.616]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_72_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.299, 0.515, 1.551]}
        rotation={[-0.028, 1.518, 2.645]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_92_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.297, 1.388, 1.499]}
        rotation={[Math.PI, 0.769, -2.399]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_73_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.409, 0.191, -1.371]}
        rotation={[0, -0.853, 2.436]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_75_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.435, 0.191, -1.394]}
        rotation={[Math.PI, 0.853, -1.912]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_77_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.278, 0.264, -1.521]}
        rotation={[0, -0.853, 2.436]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_79_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.304, 0.265, -1.545]}
        rotation={[Math.PI, 0.853, -1.912]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_81_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.479, 0.191, -1.379]}
        rotation={[Math.PI, -0.195, -2.276]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_83_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.486, 0.191, -1.345]}
        rotation={[0, 0.195, -0.485]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_87_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.682, 0.264, -1.384]}
        rotation={[0, 0.195, -0.485]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_88_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.674, 0.264, -1.417]}
        rotation={[Math.PI, -0.195, -2.276]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_85_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.354, 0.264, -1.138]}
        rotation={[Math.PI, -1.242, -0.342]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_93_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.387, 0.264, -1.126]}
        rotation={[0, 1.242, 0.722]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_94_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.418, 0.191, -1.326]}
        rotation={[Math.PI, -1.242, -0.342]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_95_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.451, 0.191, -1.316]}
        rotation={[0, 1.242, -0.849]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_100_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.489, 0.515, -1.347]}
        rotation={[0.002, 0.224, 2.617]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_101_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.449, 0.515, -1.312]}
        rotation={[-0.004, 1.213, 2.621]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_96_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.418, 0.514, -1.324]}
        rotation={[3.137, -1.271, -0.529]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_97_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.409, 0.515, -1.373]}
        rotation={[-0.002, -0.881, 2.615]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_98_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.433, 0.514, -1.395]}
        rotation={[3.139, 0.824, -0.523]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_99_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.48, 0.514, -1.378]}
        rotation={[-3.14, -0.166, -0.524]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_102_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.434, 1.388, -1.369]}
        rotation={[Math.PI, -0.718, -2.297]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_74_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.638, 0.086, -2.564]}
        rotation={[-1.025, 0, -3.104]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_76_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.638, 0.056, -2.582]}
        rotation={[2.116, 0, -2.656]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_78_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.442, 0.044, -2.495]}
        rotation={[-1.025, 0, -3.104]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_80_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.441, 0.014, -2.513]}
        rotation={[2.116, 0, -2.656]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_82_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.634, 0.057, -2.627]}
        rotation={[1.071, 0.09, 1.452]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_84_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.631, 0.088, -2.644]}
        rotation={[-2.07, -0.09, 2.07]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_89_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.425, 0.047, -2.679]}
        rotation={[-2.07, -0.09, 2.07]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_90_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.429, 0.017, -2.662]}
        rotation={[1.071, 0.09, 1.452]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_103_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.426, 0.176, -2.601]}
        rotation={[-3.122, -0.09, 1.309]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_104_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.634, 0.125, -2.586]}
        rotation={[0.02, 0.09, -0.928]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_105_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.632, 0.125, -2.621]}
        rotation={[-3.122, -0.09, -0.262]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_86_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.429, 0.174, -2.566]}
        rotation={[0.02, 0.09, -0.928]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_106_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.114, 0.099, -2.54]}
        rotation={[-0.01, 0.09, -2.04]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_107_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.117, 0.056, -2.516]}
        rotation={[-0.996, 0.001, -1.991]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_108_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.119, 0.027, -2.533]}
        rotation={[2.088, 0.005, -2.199]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_109_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.114, 0.029, -2.582]}
        rotation={[1.1, 0.087, -2.15]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_110_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.11, 0.056, -2.601]}
        rotation={[-2.099, -0.09, -2.046]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_111_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.11, 0.101, -2.573]}
        rotation={[-3.093, -0.093, -2.145]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Screw_112_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.445, 0.012, -2.51]}
        rotation={[2.337, -0.023, 2.516]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_1_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.293, 0.223, -2.203]}
        rotation={[-Math.PI / 2, 0, -3.126]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_2_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.293, 0.5, -2.203]}
        rotation={[-Math.PI / 2, 0, -3.126]}
        scale={1.093}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_3_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.382, 0.223, 1.679]}
        rotation={[-Math.PI / 2, 0, 0.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_4_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.382, 0.5, 1.679]}
        rotation={[-Math.PI / 2, 0, 0.76]}
        scale={1.093}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_5_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.383, 0.209, -1.739]}
        rotation={[-Math.PI / 2, 0, 0.686]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_6_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.383, 0.505, -1.739]}
        rotation={[-Math.PI / 2, 0, 0.686]}
        scale={1.093}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_7_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.284, 0.191, 1.511]}
        rotation={[-Math.PI / 2, 0, 1.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_8_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.284, 0.515, 1.511]}
        rotation={[-Math.PI / 2, 0, 1.024]}
        scale={1.093}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_11_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.446, 0.515, -1.355]}
        rotation={[-Math.PI / 2, 0, 0.718]}
        scale={1.093}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_9_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.446, 0.191, -1.355]}
        rotation={[-Math.PI / 2, 0, 0.718]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_10_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.635, 0.09, -2.604]}
        rotation={[0.547, -1.467, -1.569]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Joint_12_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.113, 0.061, -2.557]}
        rotation={[0.547, -1.467, -1.569]}
        scale={1.093}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_1_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.297, 0.259, -1.956]}
        rotation={[-2.304, -0.01, -3.13]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_2_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.077, 0.259, -2.323]}
        rotation={[-1.158, 0.625, 0.927]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_3_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.505, 0.259, -2.33]}
        rotation={[-1.138, -0.612, -0.893]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_4_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.553, 0.259, 1.5]}
        rotation={[-0.992, 0.479, 0.615]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_5_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.142, 0.259, 1.621]}
        rotation={[-1.363, -0.709, -1.258]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_6_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.453, 0.259, 1.916]}
        rotation={[-2.283, 0.191, 2.925]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_7_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.537, 0.26, -1.928]}
        rotation={[-0.975, 0.431, 0.552]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_8_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.142, 0.26, -1.779]}
        rotation={[-1.43, -0.708, -1.356]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_9_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.469, 0.26, -1.511]}
        rotation={[-2.258, 0.235, 2.865]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_10_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.081, 0.264, 1.388]}
        rotation={[-1.163, 0.577, 0.901]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_11_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.492, 0.264, 1.397]}
        rotation={[-1.192, -0.595, -0.953]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_12_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.278, 0.264, 1.748]}
        rotation={[-2.263, 0.015, 3.124]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_13_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.29, 0.264, -1.533]}
        rotation={[-1.013, 0.433, 0.592]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_15_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.679, 0.264, -1.401]}
        rotation={[-1.412, -0.676, -1.32]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_17_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.37, 0.264, -1.131]}
        rotation={[-2.236, 0.208, 2.885]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_14_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.441, 0.029, -2.503]}
        rotation={[-2.598, -1.48, 1.569]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_16_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.426, 0.032, -2.67]}
        rotation={[-0.156, -1.308, 1.925]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Leg_18_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.426, 0.175, -2.583]}
        rotation={[1.248, -1.308, 1.218]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_1_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.297, 0.257, -1.954]}
        rotation={[-2.304, -0.01, -3.13]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_2_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.076, 0.257, -2.324]}
        rotation={[-1.158, 0.625, 0.927]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_3_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[0.506, 0.257, -2.331]}
        rotation={[-1.138, -0.612, -0.893]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_4_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.554, 0.257, 1.499]}
        rotation={[-0.992, 0.479, 0.615]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_5_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.141, 0.257, 1.621]}
        rotation={[-1.363, -0.709, -1.258]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_6_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.453, 0.257, 1.918]}
        rotation={[-2.283, 0.191, 2.925]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_7_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.538, 0.258, -1.929]}
        rotation={[-0.975, 0.431, 0.552]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_8_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.141, 0.259, -1.779]}
        rotation={[-1.43, -0.708, -1.356]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_9_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[-1.469, 0.258, -1.51]}
        rotation={[-2.258, 0.235, 2.865]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_10_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.08, 0.262, 1.387]}
        rotation={[-1.163, 0.577, 0.901]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_11_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.493, 0.263, 1.397]}
        rotation={[-1.192, -0.595, -0.953]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_12_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.278, 0.262, 1.75]}
        rotation={[-2.263, 0.015, 3.124]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_13_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.289, 0.263, -1.535]}
        rotation={[-1.013, 0.433, 0.592]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_15_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.68, 0.263, -1.401]}
        rotation={[-1.412, -0.676, -1.32]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_17_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.369, 0.263, -1.129]}
        rotation={[-2.236, 0.208, 2.885]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_14_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.443, 0.029, -2.503]}
        rotation={[-2.598, -1.48, 1.569]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_16_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.428, 0.032, -2.671]}
        rotation={[-0.156, -1.308, 1.925]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Stop_18_Studio_Setup_Mtl_7001_0.geometry}
        material={materials['Studio_Setup_Mtl_7.001']}
        position={[1.428, 0.176, -2.584]}
        rotation={[1.248, -1.308, 1.218]}
        scale={[1, 1, 1.003]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_3_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.293, 0.99, -2.203]}
        rotation={[-Math.PI / 2, 0, -3.126]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_4_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.293, 1.558, -2.203]}
        rotation={[-Math.PI / 2, 0, -1.778]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_12_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.382, 0.99, 1.679]}
        rotation={[-Math.PI / 2, 0, 0.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_13_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.382, 1.594, 1.679]}
        rotation={[-Math.PI / 2, 0, 2.108]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_16_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.383, 0.976, -1.739]}
        rotation={[-Math.PI / 2, 0, 0.686]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_17_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[-1.383, 1.596, -1.739]}
        rotation={[-Math.PI / 2, 0, 2.035]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_20_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.284, 0.958, 1.511]}
        rotation={[-Math.PI / 2, 0, 1.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_21_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.284, 1.251, 1.511]}
        rotation={[-Math.PI / 2, 0, 2.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_25_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.446, 0.958, -1.355]}
        rotation={[-Math.PI / 2, 0, 0.718]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_27_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[1.446, 1.251, -1.355]}
        rotation={[-Math.PI / 2, 0, 2.067]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_26_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.872, 0.048, -2.536]}
        rotation={[0.547, -1.467, -1.569]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_28_Studio_Setup_Mtl_3001_0.geometry}
        material={materials['Studio_Setup_Mtl_3.001']}
        position={[0.581, 0.032, -2.51]}
        rotation={[0.547, -1.467, -0.221]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_3_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.293, 0.99, -2.203]}
        rotation={[-Math.PI / 2, 0, -3.126]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_4_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.293, 1.558, -2.203]}
        rotation={[-Math.PI / 2, 0, -1.778]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_12_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.382, 0.99, 1.679]}
        rotation={[-Math.PI / 2, 0, 0.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_13_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.382, 1.594, 1.679]}
        rotation={[-Math.PI / 2, 0, 2.108]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_16_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.383, 0.976, -1.739]}
        rotation={[-Math.PI / 2, 0, 0.686]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_17_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[-1.383, 1.596, -1.739]}
        rotation={[-Math.PI / 2, 0, 2.035]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_20_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.284, 0.958, 1.511]}
        rotation={[-Math.PI / 2, 0, 1.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_21_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.284, 1.251, 1.511]}
        rotation={[-Math.PI / 2, 0, 2.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_25_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.446, 0.958, -1.355]}
        rotation={[-Math.PI / 2, 0, 0.718]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_27_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[1.446, 1.251, -1.355]}
        rotation={[-Math.PI / 2, 0, 2.067]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_26_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.872, 0.048, -2.536]}
        rotation={[0.547, -1.467, -1.569]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Knob_28_Studio_Setup_Mtl_6001_0.geometry}
        material={materials['Studio_Setup_Mtl_6.001']}
        position={[0.581, 0.032, -2.51]}
        rotation={[0.547, -1.467, -0.221]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_1_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.293, 0.223, -2.203]}
        rotation={[-Math.PI / 2, 0, -3.126]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_4_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.382, 0.223, 1.679]}
        rotation={[-Math.PI / 2, 0, 0.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_7_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.383, 0.209, -1.739]}
        rotation={[-Math.PI / 2, 0, 0.686]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_10_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.284, 0.191, 1.511]}
        rotation={[-Math.PI / 2, 0, 1.024]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_13_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.446, 0.191, -1.355]}
        rotation={[-Math.PI / 2, 0, 0.718]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_14_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.635, 0.09, -2.604]}
        rotation={[0.547, -1.467, -1.569]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_2_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.293, 0.78, -2.203]}
        rotation={[-Math.PI / 2, 0, -1.778]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_5_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.382, 0.816, 1.679]}
        rotation={[-Math.PI / 2, 0, 2.108]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_8_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.383, 0.818, -1.739]}
        rotation={[-Math.PI / 2, 0, 2.035]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_11_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.284, 0.473, 1.511]}
        rotation={[-Math.PI / 2, 0, 2.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_15_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.446, 0.473, -1.355]}
        rotation={[-Math.PI / 2, 0, 2.067]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_16_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.355, 0.074, -2.579]}
        rotation={[0.547, -1.467, -0.221]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Softbox_2_Studio_Setup_Mtl_8001_0.geometry}
        material={materials['Studio_Setup_Mtl_8.001']}
        position={[0.241, 1.692, -1.958]}
        rotation={[0.435, -0.188, -1.484]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Softbox_1_Studio_Setup_Mtl_8001_0.geometry}
        material={materials['Studio_Setup_Mtl_8.001']}
        position={[1.113, 1.418, 1.345]}
        rotation={[2.717, -0.755, 1.271]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Softbox_Diffuser_2_Studio_Setup_Mtl_2001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_2.001']}
        position={[0.241, 1.692, -1.958]}
        rotation={[0.435, -0.188, -1.484]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Softbox_Diffuser_1_Studio_Setup_Mtl_2001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_2.001']}
        position={[1.113, 1.418, 1.345]}
        rotation={[2.717, -0.755, 1.271]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Softbox_Adapter_2_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Softbox_Adapter_1_Studio_Setup_Mtl_13001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_13.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_5_Studio_Setup_Mtl_11001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_2.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_3_Studio_Setup_Mtl_11001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_2.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_1_Studio_Setup_Mtl_11001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_2.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_5_Studio_Setup_Mtl_16001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_16.001']}
        position={[0.294, 1.723, -2.207]}
        rotation={[-1.152, -0.085, -1.76]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_3_Studio_Setup_Mtl_16001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_16.001']}
        position={[1.296, 1.418, 1.523]}
        rotation={[-1.786, -0.217, 2.349]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_1_Studio_Setup_Mtl_16001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_16.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_3_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[0.293, 0.908, -2.203]}
        rotation={[-Math.PI / 2, 0, -1.778]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_6_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.382, 1.359, 1.679]}
        rotation={[-Math.PI / 2, 0, 2.108]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_9_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[-1.383, 1.36, -1.739]}
        rotation={[-Math.PI / 2, 0, 2.035]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_12_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.284, 0.601, 1.511]}
        rotation={[-Math.PI / 2, 0, 2.372]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_17_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.446, 0.601, -1.355]}
        rotation={[-Math.PI / 2, 0, -2.424]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Tube_18_Studio_Setup_Mtl_9001_0.geometry}
        material={materials['Studio_Setup_Mtl_9.001']}
        position={[1.228, 0.068, -2.568]}
        rotation={[0.547, -1.467, -0.221]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Holder_2_Studio_Setup_Mtl_5001_0.geometry}
        material={materials['Studio_Setup_Mtl_5.001']}
        position={[-1.382, 2.2, 1.679]}
        rotation={[Math.PI, 0, -Math.PI]}
        scale={0.027}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Studio_Setup_Holder_1_Studio_Setup_Mtl_5001_0.geometry}
        material={materials['Studio_Setup_Mtl_5.001']}
        position={[-1.382, 2.2, -1.74]}
        rotation={[Math.PI, 0, -Math.PI]}
        scale={0.027}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Flap_Side_1_Studio_Setup_Mtl_10001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.227, 1.444, -1.261]}
        rotation={[-1.436, -0.152, -1.347]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Flap_Side_2_Studio_Setup_Mtl_10001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.324, 1.444, -1.15]}
        rotation={[-1.436, -0.152, -0.305]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Flap_Top_1_Studio_Setup_Mtl_10001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.265, 1.516, -1.196]}
        rotation={[0, 0.718, -1.852]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Flap_Top_2_Studio_Setup_Mtl_10001_0
            .geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.287, 1.372, -1.215]}
        rotation={[0, 0.718, -0.769]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.Studio_Setup_Spotlight_Flaps_1_Studio_Setup_Mtl_10001_0.geometry
        }
        material={materials['Studio_Setup_Mtl_10.001']}
        position={[1.462, 1.416, -1.368]}
        rotation={[-1.436, -0.152, -2.414]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('photo_studio.glb'));
