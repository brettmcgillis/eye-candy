import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function TheRoom(props) {
  const { nodes, materials } = useGLTF(modelFile('the_room.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.ceiling_insulation_0.geometry}
        material={materials['insulation.001']}
        position={[0, 315, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={[0.348, 0.349, 0.348]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wallsAndFloor_cement_0.geometry}
        material={materials['cement.001']}
        position={[0, 157.5, 0]}
        scale={[4.804, 3.094, 5.841]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.lampWithOutlet_lightAndCablewhitePlastic_0.geometry}
        material={materials['lightAndCablewhitePlastic.001']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.theDoordoor_theDooriron_0.geometry}
        material={materials['theDooriron.001']}
        position={[0, 0, -297.532]}
        scale={1.352}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.theDoordoor_theDoorwood_0.geometry}
        material={materials['theDoorwood.001']}
        position={[0, 0, -297.532]}
        scale={1.352}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.theDoorall_bolts_theDoorbolts_0.geometry}
        material={materials['theDoorbolts.001']}
        position={[0, 0, -297.532]}
        scale={1.352}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.theDoorgalvanized_steel_theDoorframeBits_0.geometry}
        material={materials['theDoorframeBits.001']}
        position={[0, 0, -297.532]}
        scale={1.352}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.theDoorrusted_iron_theDoordoorBits_0.geometry}
        material={materials['theDoordoorBits.001']}
        position={[0, 0, -297.532]}
        scale={1.352}
      />
    </group>
  );
}

useGLTF.preload(modelFile('the_room.glb'));
