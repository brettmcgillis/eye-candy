import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

import CENTER_STORE_REF_POSITION from '../sevenEleven/sevenElevenAnchors';

export default function SevenElevenLow(props) {
  const { nodes, materials } = useGLTF(modelFile('711_low.glb'));
  return (
    <group {...props} dispose={null}>
      <group
        name="CenterStoreRef"
        position={[
          CENTER_STORE_REF_POSITION.x,
          CENTER_STORE_REF_POSITION.y,
          CENTER_STORE_REF_POSITION.z,
        ]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_10.geometry}
        material={materials.B_Stack06_VB_5}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_100.geometry}
        material={materials.Material__19546_10}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_101.geometry}
        material={materials.Material__19546_11}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_102.geometry}
        material={materials.Material__19546_12}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_103.geometry}
        material={materials.B_Stack06_VB_65}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_104.geometry}
        material={materials.B_Stack06_VB_66}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_105.geometry}
        material={materials.B_Stack06_VB_67}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_106.geometry}
        material={materials.B_Stack06_VB_68}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_107.geometry}
        material={materials.B_Stack06_VB_69}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_111.geometry}
        material={materials.B_Stack06_VB_71}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_12.geometry}
        material={materials.B_Stack06_VB_7}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_17.geometry}
        material={materials.B_Stack06_VB_12}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_18.geometry}
        material={materials.B_Stack06_VB_13}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_19.geometry}
        material={materials.Material__272}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={materials.B_Stack06_VB}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_21.geometry}
        material={materials.Material__19546_1}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_22.geometry}
        material={materials.B_Stack06_VB_15}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_23.geometry}
        material={materials.B_Stack06_VB_16}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_24.geometry}
        material={materials.B_Stack06_VB_17}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_25.geometry}
        material={materials.B_Stack06_VB_18}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_26.geometry}
        material={materials.B_Stack06_VB_18}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_27.geometry}
        material={materials.B_Stack06_VB_18}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_28.geometry}
        material={materials.B_Stack06_VB_19}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_29.geometry}
        material={materials.B_Stack06_VB_20}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_3.geometry}
        material={materials.B_Stack06_VB_0}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_30.geometry}
        material={materials.B_Stack06_VB_20}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_31.geometry}
        material={materials.B_Stack06_VB_20}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_32.geometry}
        material={materials.B_Stack06_VB_21}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_33.geometry}
        material={materials.B_Stack06_VB_22}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_34.geometry}
        material={materials.B_Stack06_VB_23}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_35.geometry}
        material={materials.B_Stack06_VB_24}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_36.geometry}
        material={materials.B_Stack06_VB_25}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_37.geometry}
        material={materials.B_Stack06_VB_26}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_38.geometry}
        material={materials.B_Stack06_VB_27}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_39.geometry}
        material={materials.B_Stack06_VB_28}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.B_Stack06_VB_1}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_40.geometry}
        material={materials.B_Stack06_VB_29}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_41.geometry}
        material={materials.B_Stack06_VB_30}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_42.geometry}
        material={materials['711_wps_007456']}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_43.geometry}
        material={materials['711_wps_007456ccv']}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_44.geometry}
        material={materials.B_Stack06_VB_31}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_45.geometry}
        material={materials.B_Stack06_VB_32}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_46.geometry}
        material={materials.B_Stack06_VB_33}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_48.geometry}
        material={materials.Material__19546_2}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_49.geometry}
        material={materials.B_Stack06_VB_35}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_5.geometry}
        material={materials.B_Stack06_VB_2}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_50.geometry}
        material={materials.B_Stack06_VB_36}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_51.geometry}
        material={materials.B_Stack06_VB_37}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_52.geometry}
        material={materials.B_Stack06_VB_38}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_53.geometry}
        material={materials.B_Stack06_VB_39}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_54.geometry}
        material={materials.B_Stack06_VB_40}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_55.geometry}
        material={materials.B_Stack06_VB_41}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_56.geometry}
        material={materials.COcola}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_57.geometry}
        material={materials.COcolasc}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_58.geometry}
        material={materials.Cashier_glass}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_59.geometry}
        material={materials.Cashier_glasssss}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6.geometry}
        material={materials.Material__19546}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_60.geometry}
        material={materials.Material__19546_3}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_61.geometry}
        material={materials.Material__19546_4}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_62.geometry}
        material={materials.Material__19546_5}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_63.geometry}
        material={materials.Material__19546_6}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_64.geometry}
        material={materials.Material__19546_7}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_65.geometry}
        material={materials.B_Stack06_VB_42}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_66.geometry}
        material={materials.B_Stack06_VB_42}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_67.geometry}
        material={materials.B_Stack06_VB_42}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_68.geometry}
        material={materials.FZ_t_04sglass}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_69.geometry}
        material={materials.Material__368}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_7.geometry}
        material={materials.Material__19546_0}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_70.geometry}
        material={materials.B_Stack06_VB_43}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_71.geometry}
        material={materials.B_Stack06_VB_44}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_72.geometry}
        material={materials.B_Stack06_VB_45}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_78.geometry}
        material={materials.Material__19546_8}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_79.geometry}
        material={materials.B_Stack06_VB_51}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_8.geometry}
        material={materials.B_Stack06_VB_3}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_80.geometry}
        material={materials.B_Stack06_VB_52}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_81.geometry}
        material={materials.B_Stack06_VB_53}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_82.geometry}
        material={materials.Material__24470}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_86.geometry}
        material={materials.B_Stack06_VB_57}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_87.geometry}
        material={materials.B_Stack06_VB_57}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_88.geometry}
        material={materials.B_Stack06_VB_57}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_89.geometry}
        material={materials.B_Stack06_VB_58}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_9.geometry}
        material={materials.B_Stack06_VB_4}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_90.geometry}
        material={materials.B_Stack06_VB_59}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_91.geometry}
        material={materials.B_Stack06_VB_60}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_92.geometry}
        material={materials.B_Stack06_VB_61}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_93.geometry}
        material={materials.B_Stack06_VB_62}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_94.geometry}
        material={materials.B_Stack06_VB_63}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_95.geometry}
        material={materials.Material__404}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_97.geometry}
        material={materials.Material__19546_9}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_98.geometry}
        material={materials.Stacks_A5_003vv}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_99.geometry}
        material={materials.Stacks_Chshier_06_001}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.029}
      />
    </group>
  );
}

useGLTF.preload(modelFile('711_low.glb'));
