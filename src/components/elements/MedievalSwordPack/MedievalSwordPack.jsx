import React from 'react';

import { useGLTF } from '@react-three/drei';

import canonicalizeSword from '@utils/swordGeometry';

import { modelFile } from '../../../utils/appUtils';

const MODEL = modelFile('medieval_sword_pack.glb');

// Every sword in the pack re-framed canonically: crossguard at the origin,
// +Y to the tip, +X along the guard.
export function useSwordPackBlades() {
  const { scene } = useGLTF(MODEL);
  return React.useMemo(() => {
    scene.updateMatrixWorld(true);
    const blades = [];
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      blades.push({
        name: object.name,
        material: object.material,
        ...canonicalizeSword(geometry),
      });
    });
    return blades;
  }, [scene]);
}

export default function MedievalSwordPack(props) {
  const { nodes, materials } = useGLTF(MODEL);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_X_Type_X_Texture_0.geometry}
        material={materials.Type_X_Texture}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.026, 0.026, 0.005]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XA_Type_Xa_Texture_0.geometry}
        material={materials.Type_Xa_Texture}
        position={[-0.172, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.026, 0.026, 0.005]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XIIA_Type_Xiia_Texture_0.geometry}
        material={materials.Type_Xiia_Texture}
        position={[-0.357, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.026, 0.026, 0.005]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XIIIA_Type_Xiiia_Texture_0.geometry}
        material={materials.Type_Xiiia_Texture}
        position={[-0.578, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.026, 0.026, 0.005]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XVI_Type_Xvi_Texture_0.geometry}
        material={materials.Type_Xvi_Texture}
        position={[-0.803, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.026, 0.026, 0.005]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XV_Type_Xv_Texture_0.geometry}
        material={materials.Type_Xv_Texture}
        position={[-0.999, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.026, 0.026, 0.005]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XVA_Type_Xva_Texture_0.geometry}
        material={materials.Type_Xva_Texture}
        position={[-1.2, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.026, 0.026, 0.005]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XVII_Type_Xvii_Texture_0.geometry}
        material={materials.Type_Xvii_Texture}
        position={[-1.412, 0, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={[0.016, 0.009, 0.016]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XVIIIB_Type_Xviiib_Texture_0.geometry}
        material={materials.Type_Xviiib_Texture}
        position={[-1.633, 0, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={[0.016, 0.009, 0.016]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XVIIID_Type_Xviiid_Texture_0.geometry}
        material={materials.Type_Xviiid_Texture}
        position={[-1.851, 0, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={[0.016, 0.009, 0.016]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XVIIIE_Type_Xviiie_Texture_0.geometry}
        material={materials.Type_Xviiie_Texture}
        position={[-2.082, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.057}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XX_Type_Xx_Texture_0.geometry}
        material={materials.Type_Xx_Texture}
        position={[-2.32, 0, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={[0.016, 0.009, 0.016]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Type_XXA_Type_XxaTexture_0.geometry}
        material={materials.Type_XxaTexture}
        position={[-2.535, 0, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={[0.016, 0.009, 0.016]}
      />
    </group>
  );
}

useGLTF.preload(MODEL);
