import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function PhotoStudio2(props) {
  const { nodes, materials } = useGLTF(modelFile('photo_studio2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BG_BG_0.geometry}
        material={materials.material}
        position={[0, 0, 4.13]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cone_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.751, 0, 1.133]}
        rotation={[-Math.PI, 1.161, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_35__Matt_0.geometry}
        material={materials.Matt}
        position={[2.357, 0, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cone_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.681, 1.131, 1.294]}
        rotation={[Math.PI, 1.161, -1.166]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cone_2_Matt_0.geometry}
        material={materials.Matt}
        position={[0.772, 1.143, 3.295]}
        rotation={[0, -0.683, 2.136]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_12_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-0.751, 1.09, 1.133]}
        rotation={[Math.PI, 1.161, -2.736]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_11_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[1.212, 1.09, 1.618]}
        rotation={[0, 0.4, 0.257]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_9_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-1.122, 1.713, 4.978]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_4_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[2.482, 1.713, 3.413]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_3_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[2.357, 1.074, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_7_Lamp_Tungsden_0.geometry}
        material={materials.Lamp_Tungsden}
        position={[1.424, 1.074, 5.466]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_12_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[-0.751, 1.09, 1.133]}
        rotation={[Math.PI, 1.161, -2.736]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_12_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[-0.751, 1.09, 1.133]}
        rotation={[Math.PI, 1.161, -2.736]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_12_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[-0.751, 1.09, 1.133]}
        rotation={[Math.PI, 1.161, -2.736]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_11_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[1.212, 1.09, 1.618]}
        rotation={[0, 0.4, 0.257]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_9_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[-1.122, 1.713, 4.978]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_4_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[2.482, 1.713, 3.413]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_3_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[2.357, 1.074, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_7_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[1.424, 1.074, 5.466]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_12_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[-0.751, 1.09, 1.133]}
        rotation={[Math.PI, 1.161, -2.736]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_12_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[-0.751, 1.09, 1.133]}
        rotation={[Math.PI, 1.161, -2.736]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_12_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[-0.751, 1.09, 1.133]}
        rotation={[Math.PI, 1.161, -2.736]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_16_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.751, 0.352, 1.133]}
        rotation={[-Math.PI, 1.161, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cone_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[1.46, 0, 3.854]}
        rotation={[0, -0.683, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Difussor_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[0.718, 0, 0.969]}
        rotation={[0, 1.263, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shield_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[1.249, 0, 3.216]}
        rotation={[0, -0.463, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_9_Matt_0.geometry}
        material={materials.Matt}
        position={[1.46, 1.281, 3.855]}
        rotation={[0, -0.683, 0.217]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_Matt_0.geometry}
        material={materials.Matt}
        position={[-2.603, 1.351, 4.295]}
        rotation={[Math.PI, -0.556, 2.094]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_13_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[0.901, 1.122, 3.4]}
        rotation={[0, -0.683, -1.005]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_8_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[0.715, 1.991, 5.458]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_5_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-2.289, 1.991, 4.1]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_13_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[0.901, 1.122, 3.4]}
        rotation={[0, -0.683, -1.005]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_5_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[-2.289, 1.991, 4.1]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_13_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[0.901, 1.122, 3.4]}
        rotation={[0, -0.683, -1.005]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_5_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[-2.289, 1.991, 4.1]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_13_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[0.901, 1.122, 3.4]}
        rotation={[0, -0.683, -1.005]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_8_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[0.715, 1.991, 5.458]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_5_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[-2.289, 1.991, 4.1]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[0, 3.369, 2.277]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_2_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[0, 3.535, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_6_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[-1.103, 1.122, 5.406]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_13_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[0.901, 1.122, 3.4]}
        rotation={[0, -0.683, -1.005]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_5_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[-2.289, 1.991, 4.1]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_13_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[0.901, 1.122, 3.4]}
        rotation={[0, -0.683, -1.005]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_5_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[-2.289, 1.991, 4.1]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_13_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[0.901, 1.122, 3.4]}
        rotation={[0, -0.683, -1.005]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_5_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[-2.289, 1.991, 4.1]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_17_Matt_0.geometry}
        material={materials.Matt}
        position={[1.46, 0.542, 3.854]}
        rotation={[0, -0.683, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Default_Strobe_Matt_0.geometry}
        material={materials.Matt}
        position={[1.212, 0, 1.618]}
        rotation={[0, 0.4, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_11_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[1.212, 1.09, 1.618]}
        rotation={[0, 0.4, 0.257]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_4_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[2.482, 1.713, 3.413]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_3_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[2.357, 1.074, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_11_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[1.212, 1.09, 1.618]}
        rotation={[0, 0.4, 0.257]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_4_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[2.482, 1.713, 3.413]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_3_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[2.357, 1.074, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_11_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[1.212, 1.09, 1.618]}
        rotation={[0, 0.4, 0.257]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_4_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[2.482, 1.713, 3.413]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_3_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[2.357, 1.074, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_11_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[1.212, 1.09, 1.618]}
        rotation={[0, 0.4, 0.257]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_4_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[2.482, 1.713, 3.413]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_3_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[2.357, 1.074, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_11_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[1.212, 1.09, 1.618]}
        rotation={[0, 0.4, 0.257]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_4_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[2.482, 1.713, 3.413]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_3_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[2.357, 1.074, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_15_Matt_0.geometry}
        material={materials.Matt}
        position={[1.212, 0.352, 1.618]}
        rotation={[0, 0.4, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_2_Matt_0.geometry}
        material={materials.Matt}
        position={[2.482, 0.976, 3.413]}
        rotation={[0, -0.403, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_Matt_0.geometry}
        material={materials.Matt}
        position={[2.357, 0.336, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_6_Matt_0.geometry}
        material={materials.Matt}
        position={[0.718, 1.351, 0.969]}
        rotation={[0, 1.263, 0.398]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_3_Matt_0.geometry}
        material={materials.Matt}
        position={[0.981, 1.351, 5.202]}
        rotation={[0, 0.765, -Math.PI / 3]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_5_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.833, 1.351, 2.189]}
        rotation={[-Math.PI, 0.895, -2.949]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_4_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.21, 1.351, 1.395]}
        rotation={[Math.PI, 1.432, -2.727]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_7_Matt_0.geometry}
        material={materials.Matt}
        position={[1.249, 1.351, 3.216]}
        rotation={[0, -0.463, 0.5]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_2_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.718, 1.351, 5.07]}
        rotation={[Math.PI, 0.5, -2.825]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Difussor_Difussor_0.geometry}
        material={materials.Difussor}
        position={[0.501, 1.061, 1.648]}
        rotation={[-2.737, 1.045, 2.731]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shield_Matt_0.geometry}
        material={materials.Matt}
        position={[0.641, 0.989, 2.912]}
        rotation={[1.412, -1.522, 1.377]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sphere_3_Matt_0.geometry}
        material={materials.Matt}
        position={[0.501, 1.057, 1.647]}
        rotation={[0, 1.263, 0.398]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sphere_4_Matt_0.geometry}
        material={materials.Matt}
        position={[0.643, 0.986, 2.913]}
        rotation={[0, -0.463, 0.5]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_10_Matt_0.geometry}
        material={materials.Matt}
        position={[0.718, 0.613, 0.969]}
        rotation={[0, 1.263, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_11_Matt_0.geometry}
        material={materials.Matt}
        position={[1.249, 0.613, 3.216]}
        rotation={[0, -0.463, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Floor_Mat1_0.geometry}
        material={materials['Mat.1']}
        position={[0, 0, 2.225]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Fluor_Barn_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[0.981, 0, 5.202]}
        rotation={[0, 0.765, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_26__boom_Matt_0.geometry}
        material={materials.Matt}
        position={[-2.603, 0, 4.295]}
        rotation={[-Math.PI, -0.556, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tangsd_Barn_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.718, 0, 5.07]}
        rotation={[-Math.PI, 0.5, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Barndoors_3_Matt_0.geometry}
        material={materials.Matt}
        position={[0.592, 1.933, 5.576]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Barndoors_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.945, 1.117, 5.493]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_8_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[0.715, 1.991, 5.458]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_6_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[-1.103, 1.122, 5.406]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_8_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[0.715, 1.991, 5.458]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_6_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[-1.103, 1.122, 5.406]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_8_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[0.715, 1.991, 5.458]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_6_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[-1.103, 1.122, 5.406]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_8_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[0.715, 1.991, 5.458]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_6_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[-1.103, 1.122, 5.406]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_8_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[0.715, 1.991, 5.458]}
        rotation={[0, 0.765, -0.611]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_6_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[-1.103, 1.122, 5.406]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_6_Matt_0.geometry}
        material={materials.Matt}
        position={[0.981, 0.613, 5.202]}
        rotation={[0, 0.765, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_3_Matt_0.geometry}
        material={materials.Matt}
        position={[-2.603, 0.613, 4.295]}
        rotation={[-Math.PI, -0.556, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_4_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.718, 0.613, 5.07]}
        rotation={[-Math.PI, 0.5, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Fluorescent_Barndoors_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.122, 0, 4.978]}
        rotation={[-Math.PI, 0.801, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tungsden_Barndoors_Matt_0.geometry}
        material={materials.Matt}
        position={[1.424, 0, 5.466]}
        rotation={[0, 0.501, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Barndoors_4_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.999, 1.748, 5.104]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Barndoors_2_Matt_0.geometry}
        material={materials.Matt}
        position={[1.281, 1.15, 5.545]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_9_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[-1.122, 1.713, 4.978]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_7_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[1.424, 1.074, 5.466]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_9_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[-1.122, 1.713, 4.978]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_7_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[1.424, 1.074, 5.466]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_9_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[-1.122, 1.713, 4.978]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_7_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[1.424, 1.074, 5.466]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_9_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[-1.122, 1.713, 4.978]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_7_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[1.424, 1.074, 5.466]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_9_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[-1.122, 1.713, 4.978]}
        rotation={[Math.PI, 0.801, -2.705]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_7_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[1.424, 1.074, 5.466]}
        rotation={[0, 0.501, 0.197]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_7_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.122, 0.975, 4.978]}
        rotation={[-Math.PI, 0.801, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_5_Matt_0.geometry}
        material={materials.Matt}
        position={[1.424, 0.336, 5.466]}
        rotation={[0, 0.501, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mid_Table_Matt_0.geometry}
        material={materials.Matt}
        position={[0.245, 0, 3.016]}
        rotation={[0, -0.505, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Smal_Table_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.411, 0, 3.078]}
        rotation={[0, -0.697, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Table_40x30_Mat2_0.geometry}
        material={materials['Mat.2']}
        position={[0.23, 0.859, 3.007]}
        rotation={[0, 0.34, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_14_Matt_0.geometry}
        material={materials.Matt}
        position={[0.245, 0.288, 3.016]}
        rotation={[0, -0.505, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_13_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.411, 0.448, 3.078]}
        rotation={[0, -0.697, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_26__Matt_0.geometry}
        material={materials.Matt}
        position={[2.482, 0, 3.413]}
        rotation={[0, -0.403, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_26__2_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[1.938, 1.617, 3.182]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_26__2_Matt_0.geometry}
        material={materials.Matt}
        position={[1.938, 1.617, 3.182]}
        rotation={[0, -0.403, 0.34]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_26__3_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-1.802, 1.766, 3.798]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_26__3_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.802, 1.766, 3.798]}
        rotation={[Math.PI, -0.556, 2.118]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_35__2_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[1.759, 1.181, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Octabox_35__2_Matt_0.geometry}
        material={materials.Matt}
        position={[1.759, 1.181, 2.046]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box_Fill_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-0.103, 3.303, 2.282]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box_Fill_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.103, 3.303, 2.282]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[0, 3.369, 2.277]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_2_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[0, 3.535, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[0, 3.369, 2.277]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_2_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[0, 3.535, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[0, 3.369, 2.277]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_2_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[0, 3.535, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[0, 3.369, 2.277]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_2_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[0, 3.535, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[0, 3.369, 2.277]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_2_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[0, 3.535, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[0, 3.369, 2.277]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_2_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[0, 3.535, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box_Stripe_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-0.107, 3.469, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box_Stripe_Matt_0.geometry}
        material={materials.Matt}
        position={[-0.107, 3.469, 3.532]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Reflector_gold_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.833, 0, 2.189]}
        rotation={[-Math.PI, 0.895, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Reflector_silver_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.21, 0, 1.395]}
        rotation={[-Math.PI, 1.432, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Reflector_silver_2_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.361, 1.204, 2.779]}
        rotation={[0.407, -0.903, -3.014]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Reflector_silver_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.113, 1.042, 2.093]}
        rotation={[1.335, -1.363, -2.235]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Reflector_silver_2_Reflector_Gold_0.geometry}
        material={materials.Reflector_Gold}
        position={[-1.361, 1.204, 2.779]}
        rotation={[0.407, -0.903, -3.014]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Reflector_silver_Reflector_Silver_0.geometry}
        material={materials.Reflector_Silver}
        position={[-1.113, 1.042, 2.093]}
        rotation={[1.335, -1.363, -2.235]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sphere_2_Reflector_Gold_0.geometry}
        material={materials.Reflector_Gold}
        position={[-1.361, 1.208, 2.78]}
        rotation={[0.407, -0.903, -3.014]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_9_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.833, 0.613, 2.189]}
        rotation={[-Math.PI, 0.895, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_8_Matt_0.geometry}
        material={materials.Matt}
        position={[-1.21, 0.613, 1.395]}
        rotation={[-Math.PI, 1.432, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sphere_Reflector_Silver_0.geometry}
        material={materials.Reflector_Silver}
        position={[-1.113, 1.045, 2.095]}
        rotation={[1.335, -1.363, -2.235]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Table_20x20_Mat2_0.geometry}
        material={materials['Mat.2']}
        position={[-0.425, 1.019, 3.067]}
        rotation={[0, 1.32, 0]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Softbox_1m_boom_Matt_0.geometry}
        material={materials.Matt}
        position={[-3.484, 0, 2.744]}
        rotation={[-Math.PI, 0.078, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.boom_knee_8_Matt_0.geometry}
        material={materials.Matt}
        position={[-3.484, 1.351, 2.744]}
        rotation={[-Math.PI, 0.078, -2.777]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box_Stripe_2_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-2.846, 0.972, 2.794]}
        rotation={[1.569, 0.159, -1.494]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box_Stripe_2_Matt_0.geometry}
        material={materials.Matt}
        position={[-2.846, 0.972, 2.794]}
        rotation={[1.569, 0.159, -1.494]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_10_Lamp_Strobe_0.geometry}
        material={materials.Lamp_Strobe}
        position={[-2.797, 1.089, 2.798]}
        rotation={[-Math.PI, 0.078, -1.73]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_10_Par_Back_Card_0.geometry}
        material={materials.Par_Back_Card}
        position={[-2.797, 1.089, 2.798]}
        rotation={[-Math.PI, 0.078, -1.73]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_10_Par_Can_Case_0.geometry}
        material={materials.Par_Can_Case}
        position={[-2.797, 1.089, 2.798]}
        rotation={[-Math.PI, 0.078, -1.73]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_10_Par_Handle_0.geometry}
        material={materials.Par_Handle}
        position={[-2.797, 1.089, 2.798]}
        rotation={[-Math.PI, 0.078, -1.73]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_10_Par_knob_0.geometry}
        material={materials.Par_knob}
        position={[-2.797, 1.089, 2.798]}
        rotation={[-Math.PI, 0.078, -1.73]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_10_Par_Led_0.geometry}
        material={materials.Par_Led}
        position={[-2.797, 1.089, 2.798]}
        rotation={[-Math.PI, 0.078, -1.73]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_10_Par_Reflector_0.geometry}
        material={materials.Par_Reflector}
        position={[-2.797, 1.089, 2.798]}
        rotation={[-Math.PI, 0.078, -1.73]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.upper_knee_12_Matt_0.geometry}
        material={materials.Matt}
        position={[-3.484, 0.613, 2.744]}
        rotation={[-Math.PI, 0.078, -Math.PI]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Table_Mat2_0.geometry}
        material={materials['Mat.2']}
        position={[0, 0, 2.225]}
        scale={0.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Par_6_Lamp_Tungsden_0.geometry}
        material={materials.Lamp_Tungsden}
        position={[-1.103, 1.122, 5.406]}
        rotation={[Math.PI, 0.5, 2.236]}
        scale={0.002}
      />
    </group>
  );
}

useGLTF.preload(modelFile('photo_studio2.glb'));
