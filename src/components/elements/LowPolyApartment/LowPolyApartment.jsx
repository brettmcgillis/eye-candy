import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function LowPolyApartment(props) {
  const { nodes, materials } = useGLTF(modelFile('low_poly__apartment.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDoorFrame_apartmentDoor_0.geometry}
        material={materials.apartmentDoor}
        position={[-1.464, 1.037, 2.14]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDoorFrame001_apartmentDoor_0.geometry}
        material={materials.apartmentDoor}
        position={[2.043, 1.037, 2.14]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDoorFrame002_apartmentDoor_0.geometry}
        material={materials.apartmentDoor}
        position={[-3.032, 1.037, -0.971]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDoor_apartmentDoor_0.geometry}
        material={materials.apartmentDoor}
        position={[-1.464, 1.045, 2.196]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDoor001_apartmentDoor_0.geometry}
        material={materials.apartmentDoor}
        position={[2.043, 1.045, 2.196]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDoor002_apartmentDoor_0.geometry}
        material={materials.apartmentDoor}
        position={[-3.088, 1.045, -0.971]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.windows_windowsMaterial_0.geometry}
        material={materials.windowsMaterial}
        position={[7.913, 2.05, -0.001]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.windows001_windowsMaterial_0.geometry}
        material={materials.windowsMaterial}
        position={[2.086, 2.05, 5.902]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDecal_decal01_0.geometry}
        material={materials.decal01}
        position={[-2.501, 1.986, -3.999]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDecal002_decal01_0.geometry}
        material={materials.decal01}
        position={[7.488, 1.986, -3.999]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDecal003_decal01_0.geometry}
        material={materials.decal01}
        position={[4.223, 1.986, 2.733]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentWallsdecalLeaking_decalLeaking_0.geometry}
        material={materials.decalLeaking}
        position={[1.611, 2.539, -3.999]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentdecalSquare_decalSquare_0.geometry}
        material={materials.decalSquare}
        position={[7.823, 1.39, 1.909]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentlivingRoomdecalDamaged_decalDamaged_0.geometry}
        material={materials.decalDamaged}
        position={[0.29, 0.787, 2.056]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentWalls_greenBare_0.geometry}
        material={materials.greenBare}
        position={[-0.715, 1.471, -1.366]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentBathroom_apartmentAtlas_0.geometry}
        material={materials.apartmentAtlas}
        position={[-1.525, 1.651, 3.826]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentBeam_redBare_0.geometry}
        material={materials.redBare}
        position={[4.72, 1.922, -1.947]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentCeiling_whiteBare_0.geometry}
        material={materials.whiteBare}
        position={[1.868, 3.056, -0.511]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentBaseboard001_apartmentAtlas_0.geometry}
        material={materials.apartmentAtlas}
        position={[1.188, 0.141, 0.147]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentBaseboard_apartmentAtlas_0.geometry}
        material={materials.apartmentAtlas}
        position={[0.143, 0.083, 2.801]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentDivwall002_apartmentAtlas_0.geometry}
        material={materials.apartmentAtlas}
        position={[0.451, 2.961, 4.356]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentFloor_apartmentAtlas_0.geometry}
        material={materials.apartmentAtlas}
        position={[1.983, 0.046, 0.174]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentlivingRoomWall_redBare_0.geometry}
        material={materials.redBare}
        position={[0.328, 1.195, 2.115]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentBedroom_redBare_0.geometry}
        material={materials.redBare}
        position={[1.774, 1.758, 3.855]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentMarble_marble_0.geometry}
        material={materials.marble}
        position={[5.445, 1.182, -2.054]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.apartmentBaseboard002_apartmentAtlas_0.geometry}
        material={materials.apartmentAtlas}
        position={[1.518, 2.922, -1.3]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('low_poly__apartment.glb'));
