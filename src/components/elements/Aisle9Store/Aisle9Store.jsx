import React, { useEffect } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';

export default function Aisle9Store({
  indoorEmissiveColor = '#fffbe0',
  indoorEmissiveIntensity = 0,
  outdoorEmissiveColor = '#ffcc44',
  outdoorEmissiveIntensity = 0,
  signEmissiveColor = '#ff6600',
  signGlowIntensity = 0,
  ...props
}) {
  const { nodes, materials } = useGLTF(modelFile('aisle9Store.glb'));

  useEffect(() => {
    [materials.Sign, materials.Sign_01].forEach((mat) => {
      if (!mat) return;
      mat.emissive = new THREE.Color(signEmissiveColor);
      mat.emissiveIntensity = signGlowIntensity;
      mat.needsUpdate = true;
    });
  }, [materials.Sign, materials.Sign_01, signEmissiveColor, signGlowIntensity]);

  useEffect(() => {
    if (!materials.Lights) return;
    materials.Lights.emissive = new THREE.Color(indoorEmissiveColor);
    materials.Lights.emissiveIntensity = indoorEmissiveIntensity;
    materials.Lights.needsUpdate = true;
  }, [materials.Lights, indoorEmissiveColor, indoorEmissiveIntensity]);

  useEffect(() => {
    if (!materials.Lights_01) return;
    materials.Lights_01.emissive = new THREE.Color(outdoorEmissiveColor);
    materials.Lights_01.emissiveIntensity = outdoorEmissiveIntensity;
    materials.Lights_01.needsUpdate = true;
  }, [materials.Lights_01, outdoorEmissiveColor, outdoorEmissiveIntensity]);

  return (
    <group {...props} dispose={null}>
      <group name="CenterStoreRef" position={[-5.8, 2, -8]} />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_6twelve_0'].geometry}
        material={materials['6twelve']}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Bricks_0'].geometry}
        material={materials.Bricks}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Concrete_0'].geometry}
        material={materials.Concrete}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Concrete_01_0'].geometry}
        material={materials.Concrete_01}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Door_02_0'].geometry}
        material={materials.Door_02}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Metal_02_0'].geometry}
        material={materials.Metal_02}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Metal_04_0'].geometry}
        material={materials.Metal_04}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Office_0'].geometry}
        material={materials.Office}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Plaste_0'].geometry}
        material={materials.Plaste}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Refrigerators_0'].geometry}
        material={materials.Refrigerators}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Refrigerators_01_0'].geometry}
        material={materials.Refrigerators_01}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Roof_tiles_0'].geometry}
        material={materials.Roof_tiles}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['6twelve_Sign_0'].geometry}
        material={materials.Sign}
        position={[-5.574, 3.81, -17.428]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Air_conditioners_outdoor_electronics_0.geometry}
        material={materials.outdoor_electronics}
        position={[4.363, 3.683, -26.276]}
        rotation={[-0.942, 1.57, 0.05]}
        scale={0.585}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Air_conditioners_01_outdoor_electronics_0.geometry}
        material={materials.outdoor_electronics}
        position={[2.193, 3.526, -26.206]}
        rotation={[-0.942, 1.57, 0.05]}
        scale={0.585}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Air_conditioners_02_outdoor_electronics_0.geometry}
        material={materials.outdoor_electronics}
        position={[-17.256, 4.411, -24.413]}
        rotation={[Math.PI, 0, Math.PI / 2]}
        scale={0.585}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Alcohol_Cigars_Alcohol_0.geometry}
        material={materials.Alcohol}
        position={[-15.687, 1.05, -10.966]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Alcohol_Cigars_Cigars_0.geometry}
        material={materials.Cigars}
        position={[-15.687, 1.05, -10.966]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Alcohol_Cigars_Control_0.geometry}
        material={materials.Control}
        position={[-15.687, 1.05, -10.966]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Alcohol_Cigars_Plastic_07_0.geometry}
        material={materials.Plastic_07}
        position={[-15.687, 1.05, -10.966]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Asphalt_Asphalt_0.geometry}
        material={materials.Asphalt}
        position={[3.07, -0.415, 2.101]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Asphalt_01_Asphalt_01_0.geometry}
        material={materials.Asphalt_01}
        position={[4.329, -0.623, 6.459]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Background_Trees_Background_0.geometry}
        material={materials.Trees_Background}
        position={[0.337, 7.683, 4.24]}
        rotation={[Math.PI, Math.PI / 2, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Bote002_Plastic_04_0.geometry}
        material={materials.Plastic_04}
        position={[-12.821, 0.396, -19.41]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={1.662}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Bote002_Plastic_05_0.geometry}
        material={materials.Plastic_05}
        position={[-12.821, 0.396, -19.41]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={1.662}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Boxs_CardboardPlain_0.geometry}
        material={materials.CardboardPlain}
        position={[-9.283, 1.518, -22.941]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.323}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Boxs_01_CardboardPlain_0.geometry}
        material={materials.CardboardPlain}
        position={[-9.131, 1.373, -25.097]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={[-0.323, 0.323, 0.323]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Boxs_02_CardboardPlain_0.geometry}
        material={materials.CardboardPlain}
        position={[-5.717, 1.285, -22.915]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.323}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Boxs_03_CardboardPlain_0.geometry}
        material={materials.CardboardPlain}
        position={[-5.999, 1.508, -25.088]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={0.323}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Boxs_04_CardboardPlain_0.geometry}
        material={materials.CardboardPlain}
        position={[-2.403, 1.373, -22.925]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={0.323}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Boxs_05_CardboardPlain_0.geometry}
        material={materials.CardboardPlain}
        position={[-2.503, 1.518, -25.08]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.323}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Boxs_06_CardboardPlain_0.geometry}
        material={materials.CardboardPlain}
        position={[1.076, 1.374, -25.032]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={[-0.323, 0.323, 0.323]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Broom_Broom_0.geometry}
        material={materials.Broom}
        position={[-12.891, 1.117, -17.939]}
        rotation={[-1.506, 0, -Math.PI]}
        scale={1.4}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Broom_01_Broom_01_0.geometry}
        material={materials.Broom_01}
        position={[-12.891, 1.117, -18.045]}
        rotation={[-1.44, 0, -Math.PI]}
        scale={1.4}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cabinet_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.302, 1.66, -14.172]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.134, 0.174, 0.103]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Candys_Food_shelf_03_0.geometry}
        material={materials.Food_shelf_03}
        position={[-13.072, 1.396, -11.325]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.097}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Candys_01_Candys_0.geometry}
        material={materials.Candys}
        position={[-13.115, 1.404, -10.945]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.237}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Candys_02_Food_shelf_04_0.geometry}
        material={materials.Food_shelf_03}
        position={[-12.976, 1.583, -13.406]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.069}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Candys_03_Food_shelf_03_0.geometry}
        material={materials.Food_shelf_03}
        position={[-13.166, 1.774, -9.084]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Candys_03_Plastic_03_0.geometry}
        material={materials.Plastic_03}
        position={[-13.166, 1.774, -9.084]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Carrier_Metal_0.geometry}
        material={materials.Metal}
        position={[4.955, 1.207, -9.645]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={[-1.162, 1.162, 1.162]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cash_register_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.661, 1.453, -13.534]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.154}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Chair_Leather_01_0.geometry}
        material={materials.Leather_01}
        position={[3.447, 0.766, -24.06]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.219}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Chair_Metal_03_0.geometry}
        material={materials.Metal_03}
        position={[3.447, 0.766, -24.06]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.219}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Coffee_maker_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.227, 1.799, -14.747]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.364}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Crosswalk_RoadMarkings_0.geometry}
        material={materials.RoadMarkings}
        position={[11.8, -0.694, 12.049]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={3.002}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Diablito_industrial_Metal_05_0.geometry}
        material={materials.Metal_05}
        position={[-16.16, 0.654, -18.358]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Diablito_industrial_Wheel_0.geometry}
        material={materials.Wheel}
        position={[-16.16, 0.654, -18.358]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_Glass_0.geometry}
        material={materials.Glass}
        position={[-4.696, 1.45, -8.275]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[-1.019, 1.019, 1.019]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_01_Glass_0.geometry}
        material={materials.Glass}
        position={[-6.88, 1.45, -8.275]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.019}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[-4.696, 1.45, -8.275]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[-1.019, 1.019, 1.019]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_01_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[-6.88, 1.45, -8.275]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.019}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_Metal_05_0.geometry}
        material={materials.Metal_05}
        position={[-4.696, 1.45, -8.275]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[-1.019, 1.019, 1.019]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_01_Metal_05_0.geometry}
        material={materials.Metal_05}
        position={[-6.88, 1.45, -8.275]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.019}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_02_Door_01_0.geometry}
        material={materials.Door_01}
        position={[-15.543, 1.442, -17.644]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={[-1.075, 1.075, 1.075]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_02_Glass_0.geometry}
        material={materials.Glass}
        position={[-15.543, 1.442, -17.644]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={[-1.075, 1.075, 1.075]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_03_Door_03_0.geometry}
        material={materials.Door_03}
        position={[-14.258, 1.457, -25.89]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.605}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_04_Door_0.geometry}
        material={materials.Door}
        position={[4.482, 1.442, -13.325]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={1.075}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_frame_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[-14.891, 1.672, -17.67]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_frame_01_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[-14.891, 1.672, -25.898]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_frame_02_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[3.844, 1.672, -13.301]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_Mostrator_Metal_0.geometry}
        material={materials.Metal}
        position={[-12.949, 0.71, -16.244]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Door_Mostrator_Plastic_07_0.geometry}
        material={materials.Plastic_07}
        position={[-12.949, 0.71, -16.244]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Dry_leaves_Scattered_0.geometry}
        material={materials.Scattered}
        position={[11.384, -0.443, -0.925]}
        rotation={[-1.559, 0, 0]}
        scale={[3.465, 3.267, 2.181]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Dry_leaves_01_Scattered_0.geometry}
        material={materials.Scattered}
        position={[11.383, -0.376, -10.888]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={3.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Dry_leaves_02_Scattered_0.geometry}
        material={materials.Scattered}
        position={[11.383, -0.377, -17.04]}
        rotation={[-Math.PI / 2, 0, -1.287]}
        scale={3.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Dry_leaves_03_Scattered_0.geometry}
        material={materials.Scattered}
        position={[11.383, -0.381, -23.338]}
        rotation={[-Math.PI / 2, 0, 1.076]}
        scale={3.52}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Dump_Metal_09_0.geometry}
        material={materials.Metal_09}
        position={[3.521, 0.32, -26.737]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.763}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Dump_Trash_01_0.geometry}
        material={materials.Trash_01}
        position={[3.521, 0.32, -26.737]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.763}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.dustpan_Plastic_02_0.geometry}
        material={materials.Plastic_02}
        position={[-12.595, 1.057, -18.658]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.extinguisher_extinguisher_0.geometry}
        material={materials.extinguisher}
        position={[-12.57, 1.587, -19.722]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.114}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Food_Food_shelf_03_0.geometry}
        material={materials.Food_shelf_03}
        position={[-7.391, 1.218, -11.54]}
        rotation={[-Math.PI, 0, Math.PI]}
        scale={[-0.179, 0.179, 0.179]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Food_01_Food_shelf_0.geometry}
        material={materials.Food_shelf}
        position={[-7.4, 1.218, -14.344]}
        rotation={[-Math.PI, 0, Math.PI]}
        scale={[-0.179, 0.179, 0.179]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Food_02_Food_shelf_01_0.geometry}
        material={materials.Food_shelf_01}
        position={[-7.4, 1.218, -17.003]}
        rotation={[-Math.PI, 0, Math.PI]}
        scale={[-0.179, 0.179, 0.179]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Food_03_Food_shelf_04_0.geometry}
        material={materials.Food_shelf_03}
        position={[-1.059, 1.218, -11.619]}
        rotation={[-Math.PI, 0, Math.PI]}
        scale={[-0.179, 0.179, 0.179]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Food_04_Food_shelf_05_0.geometry}
        material={materials.Food_shelf_05}
        position={[-1.12, 1.218, -14.613]}
        rotation={[-Math.PI, 0, Math.PI]}
        scale={[-0.179, 0.179, 0.179]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Food_05_Food_shelf_02_0.geometry}
        material={materials.Food_shelf_02}
        position={[-1.132, 1.218, -17.003]}
        rotation={[-Math.PI, 0, Math.PI]}
        scale={[-0.179, 0.179, 0.179]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Food_shelf_Store_fridge_0.geometry}
        material={materials.Store_fridge}
        position={[4.543, 1.531, -18.15]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.666}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Fuse_Boxes_outdoor_electronics_0.geometry}
        material={materials.outdoor_electronics}
        position={[6.121, 0.475, -20.138]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.491, 0.491, 0.52]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Fuse_Boxes_01_outdoor_electronics_0.geometry}
        material={materials.outdoor_electronics}
        position={[5.588, 0.41, -21.95]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.275}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Fuse_Boxes_02_outdoor_electronics_0.geometry}
        material={materials.outdoor_electronics}
        position={[5.663, 1.141, -24.061]}
        rotation={[Math.PI, 0, 0]}
        scale={0.755}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Garbage_bag_Garbage_bag_0.geometry}
        material={materials.Garbage_bag}
        position={[1.73, 0.009, -26.296]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.291, 0.338, 0.361]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Garbage_bag_01_Garbage_bag_0.geometry}
        material={materials.Garbage_bag}
        position={[1.678, -0.09, -26.968]}
        rotation={[-Math.PI / 2, 0, 1.257]}
        scale={[0.291, 0.338, 0.273]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Garbage_bag_02_Garbage_bag_0.geometry}
        material={materials.Garbage_bag}
        position={[1.164, -0.026, -26.481]}
        rotation={[-Math.PI / 2, 0, 1.425]}
        scale={[0.291, 0.338, 0.329]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Glasses_Glass_0.geometry}
        material={materials.Glass}
        position={[-5.708, 1.685, -8.27]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grass_Grass_0.geometry}
        material={materials.Grass}
        position={[5.918, -0.031, -0.853]}
        rotation={[-Math.PI, -0.606, -Math.PI]}
        scale={[0.71, 0.494, 0.494]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grass__Concrete_01_0.geometry}
        material={materials.Concrete_01}
        position={[-5.626, 0.116, -17.058]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grass__Grass_02_0.geometry}
        material={materials.Grass_02}
        position={[-5.626, 0.116, -17.058]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grass__GrassDead_0.geometry}
        material={materials.GrassDead}
        position={[-5.626, 0.116, -17.058]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grass_01_Grass_0.geometry}
        material={materials.Grass}
        position={[11.441, -0.04, -0.61]}
        rotation={[-Math.PI, 0.828, -Math.PI]}
        scale={[0.71, 0.494, 0.494]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grass_02_Grass_0.geometry}
        material={materials.Grass}
        position={[11.441, -0.04, -13.032]}
        rotation={[-Math.PI, 0.828, -Math.PI]}
        scale={[0.71, 0.494, 0.494]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Grass_03_Grass_0.geometry}
        material={materials.Grass}
        position={[11.441, -0.04, -22.475]}
        rotation={[-Math.PI, 0.828, -Math.PI]}
        scale={[0.71, 0.494, 0.494]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.guard_rails_RoadRail_0.geometry}
        material={materials.RoadRail}
        position={[-16.607, 0.61, -1.151]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.295}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Hand_soap_01013_Hygiene_0.geometry}
        material={materials.Hygiene}
        position={[4.978, 1.374, -11.404]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={0.031}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.IceCream_Refrigerator_Door_Glass_0.geometry}
        material={materials.Glass}
        position={[-11.519, 1.162, -18.09]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.065}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.IceCream_Refrigerator_Door_01_Glass_0.geometry}
        material={materials.Glass}
        position={[-11.519, 1.147, -18.998]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={[-1.065, 1.065, 1.065]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.IceCream_Refrigerator_Door_Plastic_08_0.geometry}
        material={materials.Plastic_08}
        position={[-11.519, 1.162, -18.09]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.065}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.IceCream_Refrigerator_Door_01_Plastic_08_0.geometry}
        material={materials.Plastic_08}
        position={[-11.519, 1.147, -18.998]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={[-1.065, 1.065, 1.065]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.IceCream_Refrigerator_icecream_popsicles_0.geometry}
        material={materials.icecream_popsicles}
        position={[-11.567, 0.619, -18.546]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.IceCream_Refrigerator_Metal_0.geometry}
        material={materials.Metal}
        position={[-11.567, 0.619, -18.546]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.IceCream_Refrigerator_Plastic_08_0.geometry}
        material={materials.Plastic_08}
        position={[-11.567, 0.619, -18.546]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Keyboard_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.661, 1.479, -13.476]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={0.102}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Ladders_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[-16.416, 2.833, -26.289]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_Lights_0.geometry}
        material={materials.Lights}
        position={[-7.508, 3.724, -10.008]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_01_Lights_0.geometry}
        material={materials.Lights}
        position={[-7.508, 3.724, -13.119]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_02_Lights_0.geometry}
        material={materials.Lights}
        position={[-7.508, 3.724, -15.903]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_03_Lights_0.geometry}
        material={materials.Lights}
        position={[-7.508, 3.724, -18.731]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_04_Lights_0.geometry}
        material={materials.Lights}
        position={[-1.433, 3.733, -10.009]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_05_Lights_0.geometry}
        material={materials.Lights}
        position={[-1.433, 3.733, -13.12]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_06_Lights_0.geometry}
        material={materials.Lights}
        position={[-1.433, 3.733, -15.903]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_07_Lights_0.geometry}
        material={materials.Lights}
        position={[-1.433, 3.733, -18.732]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_08_Lights_0.geometry}
        material={materials.Lights}
        position={[-14.831, 3.816, -13.119]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_09_Lights_0.geometry}
        material={materials.Lights}
        position={[-14.408, 3.816, -20.942]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_10_Lights_0.geometry}
        material={materials.Lights}
        position={[-11.171, 3.309, -23.011]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_11_Lights_0.geometry}
        material={materials.Lights}
        position={[-0.216, 3.309, -23.011]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_12_Lights_0.geometry}
        material={materials.Lights}
        position={[-14.892, 3.085, -26.031]}
        rotation={[0, 0, -Math.PI]}
        scale={0.471}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_14_Lights_0.geometry}
        material={materials.Lights}
        position={[3.952, 3.97, -11.229]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={0.471}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_Metal_0.geometry}
        material={materials.Metal}
        position={[-7.508, 3.724, -10.008]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_01_Metal_0.geometry}
        material={materials.Metal}
        position={[-7.508, 3.724, -13.119]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_02_Metal_0.geometry}
        material={materials.Metal}
        position={[-7.508, 3.724, -15.903]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_03_Metal_0.geometry}
        material={materials.Metal}
        position={[-7.508, 3.724, -18.731]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_04_Metal_0.geometry}
        material={materials.Metal}
        position={[-1.433, 3.733, -10.009]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_05_Metal_0.geometry}
        material={materials.Metal}
        position={[-1.433, 3.733, -13.12]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_06_Metal_0.geometry}
        material={materials.Metal}
        position={[-1.433, 3.733, -15.903]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_07_Metal_0.geometry}
        material={materials.Metal}
        position={[-1.433, 3.733, -18.732]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_08_Metal_0.geometry}
        material={materials.Metal}
        position={[-14.831, 3.816, -13.119]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_09_Metal_0.geometry}
        material={materials.Metal}
        position={[-14.408, 3.816, -20.942]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_10_Metal_0.geometry}
        material={materials.Metal}
        position={[-11.171, 3.309, -23.011]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_11_Metal_0.geometry}
        material={materials.Metal}
        position={[-0.216, 3.309, -23.011]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_12_Metal_0.geometry}
        material={materials.Metal}
        position={[-14.892, 3.085, -26.031]}
        rotation={[0, 0, -Math.PI]}
        scale={0.471}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_14_Metal_0.geometry}
        material={materials.Metal}
        position={[3.952, 3.97, -11.229]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        scale={0.471}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_13_Lights_0.geometry}
        material={materials.Lights}
        position={[-5.805, 3.503, -7.446]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lights_13_Metal_0.geometry}
        material={materials.Metal}
        position={[-5.805, 3.503, -7.446]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.713}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lottery_Lottery_0.geometry}
        material={materials.Lottery}
        position={[-13.269, 1.653, -10.007]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.354}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mirror_Metal_01_0.geometry}
        material={materials.Metal_01}
        position={[5.001, 1.955, -11.684]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mirror_Mirror_0.geometry}
        material={materials.Mirror}
        position={[5.001, 1.955, -11.684]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.246}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Monitor_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.383, 1.641, -13.571]}
        rotation={[-Math.PI / 2, 0, 0.154]}
        scale={[0.162, 0.23, 0.162]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mop_01002_Mop_0.geometry}
        material={materials.material}
        position={[-13.422, 1.154, -17.916]}
        rotation={[-1.516, 0, -0.248]}
        scale={1.256}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mostrator_Candys_0.geometry}
        material={materials.Candys}
        position={[-13.191, 0.662, -11.893]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mostrator_Plastic_07_0.geometry}
        material={materials.Plastic_07}
        position={[-13.191, 0.662, -11.893]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mostrator_Toothbrushes_0.geometry}
        material={materials.Toothbrushes}
        position={[-13.191, 0.662, -11.893]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Napkins_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.4, 1.468, -15.994]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.151}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Parking_lot_Parking_lot_0.geometry}
        material={materials.Asphalt_01}
        position={[-4.843, -0.337, -0.722]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Payment_Terminal_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.605, 1.322, -12.862]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={0.075}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plants_Plants_01_0.geometry}
        material={materials.Plants_01}
        position={[-17.766, 0.989, -11.517]}
        rotation={[0, 0.797, 0]}
        scale={[0.35, 0.396, 0.35]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plants_Plants_02_0.geometry}
        material={materials.Plants_02}
        position={[-17.766, 0.989, -11.517]}
        rotation={[0, 0.797, 0]}
        scale={[0.35, 0.396, 0.35]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_Concrete_01_0.geometry}
        material={materials.Concrete_01}
        position={[-16.634, -0.385, 2.906]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_01_Concrete_01_0.geometry}
        material={materials.Concrete_01}
        position={[5.15, -0.385, -26.252]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_Lights_01_0.geometry}
        material={materials.Lights_01}
        position={[-16.634, -0.385, 2.906]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_01_Lights_01_0.geometry}
        material={materials.Lights_01}
        position={[5.15, -0.385, -26.252]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_02_Lights_01_0002.geometry}
        material={materials.Lights_01}
        position={[13.126, -0.385, -46.561]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_Metal_0.geometry}
        material={materials.Metal}
        position={[-16.634, -0.385, 2.906]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_01_Metal_0.geometry}
        material={materials.Metal}
        position={[5.15, -0.385, -26.252]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_Metal_10_0.geometry}
        material={materials.Metal_10}
        position={[-16.634, -0.385, 2.906]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_01_Metal_10_0.geometry}
        material={materials.Metal_10}
        position={[5.15, -0.385, -26.252]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_02_Concrete_01_0.geometry}
        material={materials.Concrete_01}
        position={[13.126, -0.385, -46.561]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_02_Lights_01_0.geometry}
        material={materials.Lights_01}
        position={[13.126, -0.385, -46.561]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_02_Lights_01_0001.geometry}
        material={materials.Lights_01}
        position={[13.126, -0.385, -46.561]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_02_Lights_01_0003.geometry}
        material={materials.Lights_01}
        position={[13.126, -0.385, -46.561]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_02_Metal_0.geometry}
        material={materials.Metal}
        position={[13.126, -0.385, -46.561]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_02_Metal_10_0.geometry}
        material={materials.Metal_10}
        position={[13.126, -0.385, -46.561]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_03_Concrete_01_0.geometry}
        material={materials.Concrete_01}
        position={[-39.498, -0.52, 4.503]}
        rotation={[-Math.PI / 2, 0, -1.568]}
        scale={0.232}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_03_Lights_01_0.geometry}
        material={materials.Lights_01}
        position={[-39.498, -0.52, 4.503]}
        rotation={[-Math.PI / 2, 0, -1.568]}
        scale={0.232}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_03_Lights_01_0001.geometry}
        material={materials.Lights_01}
        position={[-39.498, -0.52, 4.503]}
        rotation={[-Math.PI / 2, 0, -1.568]}
        scale={0.232}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_03_Metal_0.geometry}
        material={materials.Metal}
        position={[-39.498, -0.52, 4.503]}
        rotation={[-Math.PI / 2, 0, -1.568]}
        scale={0.232}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Post_light_03_Metal_10_0.geometry}
        material={materials.Metal_10}
        position={[-39.498, -0.52, 4.503]}
        rotation={[-Math.PI / 2, 0, -1.568]}
        scale={0.232}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Rug002_Fabric_0.geometry}
        material={materials.Fabric}
        position={[-5.798, 0.132, -8.971]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Rug002_Fabric_01_0.geometry}
        material={materials.Fabric_01}
        position={[-5.798, 0.132, -8.971]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Rug003_Fabric_0.geometry}
        material={materials.Fabric}
        position={[-5.798, 0.132, -7.547]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Rug003_Fabric_01_0.geometry}
        material={materials.Fabric_01}
        position={[-5.798, 0.132, -7.547]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Rug004_Fabric_0.geometry}
        material={materials.Fabric}
        position={[-14.903, 0.132, -24.809]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Rug004_Fabric_01_0.geometry}
        material={materials.Fabric_01}
        position={[-14.903, 0.132, -24.809]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_Metal_06_0.geometry}
        material={materials.Metal_06}
        position={[-1.132, 1.009, -16.996]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_01_Metal_06_0.geometry}
        material={materials.Metal_06}
        position={[-7.399, 1.009, -16.996]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_02_Metal_06_0.geometry}
        material={materials.Metal_06}
        position={[-7.399, 1.009, -14.339]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_03_Metal_06_0.geometry}
        material={materials.Metal_06}
        position={[-7.391, 1.009, -11.539]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_Prices_0.geometry}
        material={materials.Prices}
        position={[-1.132, 1.009, -16.996]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_01_Prices_0.geometry}
        material={materials.Prices}
        position={[-7.399, 1.009, -16.996]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_02_Prices_0.geometry}
        material={materials.Prices}
        position={[-7.399, 1.009, -14.339]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_03_Prices_0.geometry}
        material={materials.Prices}
        position={[-7.391, 1.009, -11.539]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_04_Metal_06_0.geometry}
        material={materials.Metal_06}
        position={[-1.627, 1.009, -14.624]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_05_Metal_06_0.geometry}
        material={materials.Metal_06}
        position={[-1.568, 1.009, -11.63]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_04_Prices_0.geometry}
        material={materials.Prices}
        position={[-1.627, 1.009, -14.624]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_05_Prices_0.geometry}
        material={materials.Prices}
        position={[-1.568, 1.009, -11.63]}
        rotation={[-Math.PI / 2, 0, -1.57]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_06_Metal_0.geometry}
        material={materials.Metal}
        position={[-9.19, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_07_Metal_0.geometry}
        material={materials.Metal}
        position={[-9.19, 1.115, -22.891]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_08_Metal_0.geometry}
        material={materials.Metal}
        position={[-5.768, 1.115, -22.891]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_09_Metal_0.geometry}
        material={materials.Metal}
        position={[-5.768, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_10_Metal_0.geometry}
        material={materials.Metal}
        position={[-2.371, 1.115, -22.891]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_11_Metal_0.geometry}
        material={materials.Metal}
        position={[-2.371, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_12_Metal_0.geometry}
        material={materials.Metal}
        position={[1.057, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_06_Metal_08_0.geometry}
        material={materials.Metal_08}
        position={[-9.19, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_07_Metal_08_0.geometry}
        material={materials.Metal_08}
        position={[-9.19, 1.115, -22.891]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_08_Metal_08_0.geometry}
        material={materials.Metal_08}
        position={[-5.768, 1.115, -22.891]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_09_Metal_08_0.geometry}
        material={materials.Metal_08}
        position={[-5.768, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_10_Metal_08_0.geometry}
        material={materials.Metal_08}
        position={[-2.371, 1.115, -22.891]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_11_Metal_08_0.geometry}
        material={materials.Metal_08}
        position={[-2.371, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Shelf_12_Metal_08_0.geometry}
        material={materials.Metal_08}
        position={[1.057, 1.115, -25.136]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sign_Sign_01_0.geometry}
        material={materials.Sign_01}
        position={[-16.587, 3.121, -23.705]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        scale={[-0.242, 0.242, 0.242]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sink_Metal_0.geometry}
        material={materials.Metal}
        position={[-12.527, 0.594, -25.183]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sink_01_Metal_01_0.geometry}
        material={materials.Metal_01}
        position={[4.844, 0.945, -11.684]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sink_01_Plastic_03_0.geometry}
        material={materials.Plastic_03}
        position={[4.844, 0.945, -11.684]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Table_01002_Metal_03_0.geometry}
        material={materials.Metal_03}
        position={[4.347, 0.108, -24.345]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.064}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Table_01002_Wood_02_0.geometry}
        material={materials.Wood_02}
        position={[4.347, 0.108, -24.345]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.064}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tiles_Tiles_0.geometry}
        material={materials.Tiles}
        position={[-7.078, 0.091, -16.582]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Toilet_Plastic_03_0.geometry}
        material={materials.Plastic_03}
        position={[4.373, 0.325, -8.932]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.251, 0.351, 0.288]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Toilet_paper_01013_Hygiene_0.geometry}
        material={materials.Hygiene}
        position={[4.898, 1.183, -9.635]}
        rotation={[Math.PI, 0, 0.801]}
        scale={[-0.085, 0.085, 0.085]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_Metal_03_0.geometry}
        material={materials.Metal_03}
        position={[-7.822, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_01_Metal_03_0.geometry}
        material={materials.Metal_03}
        position={[-3.735, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_Plastic_01_0.geometry}
        material={materials.Plastic_01}
        position={[-7.822, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_01_Plastic_01_0.geometry}
        material={materials.Plastic_01}
        position={[-3.735, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_SoilSand_0.geometry}
        material={materials.SoilSand}
        position={[-7.822, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_Trash_01_0.geometry}
        material={materials.Trash_01}
        position={[-7.822, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_01_Trash_01_0.geometry}
        material={materials.Trash_01}
        position={[-3.735, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Trash_can014_Plastic_0.geometry}
        material={materials.Plastic}
        position={[3.687, 0.389, -8.882]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={1.36}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Trash_can014_Plastic_06_0.geometry}
        material={materials.Plastic_06}
        position={[3.687, 0.389, -8.882]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={1.36}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_01_SoilSand_0.geometry}
        material={materials.SoilSand}
        position={[-3.735, 0.392, -7.644]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_lid_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[2.85, 1.363, -26.065]}
        rotation={[-Math.PI / 4, 0, 0]}
        scale={[0.167, 0.022, 0.022]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trash_can_lid_01_Metal_04_0.geometry}
        material={materials.Metal_04}
        position={[4.182, 1.36, -26.07]}
        rotation={[-Math.PI / 4, 0, 0]}
        scale={[0.167, 0.022, 0.022]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_Branches_0.geometry}
        material={materials.Branches}
        position={[11.768, -0.31, -0.886]}
        rotation={[-Math.PI / 2, 0, -0.109]}
        scale={1.182}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_Wood_18_0.geometry}
        material={materials.Wood_18}
        position={[11.768, -0.31, -0.886]}
        rotation={[-Math.PI / 2, 0, -0.109]}
        scale={1.182}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_01_Branches_0.geometry}
        material={materials.Branches}
        position={[11.768, -0.31, -10.758]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.986}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_01_Wood_18_0.geometry}
        material={materials.Wood_18}
        position={[11.768, -0.31, -10.758]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.986}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_02_Branches_0.geometry}
        material={materials.Branches}
        position={[11.519, -0.31, -17.615]}
        rotation={[-Math.PI / 2, 0, 0.866]}
        scale={1.135}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_02_Wood_18_0.geometry}
        material={materials.Wood_18}
        position={[11.519, -0.31, -17.615]}
        rotation={[-Math.PI / 2, 0, 0.866]}
        scale={1.135}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_03_Branches_0.geometry}
        material={materials.Branches}
        position={[11.932, -0.31, -23.529]}
        rotation={[-Math.PI / 2, 0, 2.954]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tree_03_Wood_18_0.geometry}
        material={materials.Wood_18}
        position={[11.932, -0.31, -23.529]}
        rotation={[-Math.PI / 2, 0, 2.954]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Trees_Tree_0.geometry}
        material={materials.Tree}
        position={[2.417, -0.52, 20.312]}
        rotation={[-Math.PI / 2, 0, -1.568]}
        scale={0.232}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Trees_Tree_01_0.geometry}
        material={materials.Tree_01}
        position={[2.417, -0.52, 20.312]}
        rotation={[-Math.PI / 2, 0, -1.568]}
        scale={0.232}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tumblers_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.419, 1.396, -15.303]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.104}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tumblers_01_Mostrator_0.geometry}
        material={materials.Mostrator}
        position={[-13.419, 1.396, -15.604]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.104}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Ventilation_Metal_07_0.geometry}
        material={materials.Metal_07}
        position={[-5.421, 3.739, -22.922]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Ventilation_01_Respirator_0.geometry}
        material={materials.Respirator}
        position={[-7.879, 3.736, -26.057]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.285}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall_Bricks_0.geometry}
        material={materials.Bricks}
        position={[-18.607, 0.597, 2.223]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Wall_Concrete_0.geometry}
        material={materials.Concrete}
        position={[-18.607, 0.597, 2.223]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('aisle9Store.glb'));
