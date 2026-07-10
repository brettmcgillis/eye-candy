import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function BrokenConcreteDebris(props) {
  const { nodes, materials } = useGLTF(modelFile('broken_concrete_debris.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_pillar_001002_conclete_debri_skin_0.geometry
        }
        material={materials.conclete_debri_skin}
        position={[-1.6, 0, 1.395]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_pillar_002002_conclete_debri_skin_0.geometry
        }
        material={materials.conclete_debri_skin}
        position={[-0.633, 0, 1.395]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_pillar_003001_conclete_debri_skin_0.geometry
        }
        material={materials.conclete_debri_skin}
        position={[1.406, 0, 1.383]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_pillar_002003_conclete_debri_skin_0.geometry
        }
        material={materials.conclete_debri_skin}
        position={[0.276, 0, 1.359]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_wall_001001_conclete_debri_skin_0.geometry
        }
        material={materials.conclete_debri_skin}
        position={[-0.868, 0, 0.03]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_wall_002001_conclete_debri_skin_0.geometry
        }
        material={materials.conclete_debri_skin}
        position={[1.333, 0, 0.021]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_wall_003001_conclete_debri_skin_0.geometry
        }
        material={materials.conclete_debri_skin}
        position={[0.573, 0, 0.015]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_wall_cornor_001001_conclete_debri_skin_0
            .geometry
        }
        material={materials.conclete_debri_skin}
        position={[-1.739, 0, -1.826]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_wall_cornor_002001_conclete_debri_skin_0
            .geometry
        }
        material={materials.conclete_debri_skin}
        position={[-0.186, 0, -1.82]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.broken_concrete_wall_cornor_003001_conclete_debri_skin_0
            .geometry
        }
        material={materials.conclete_debri_skin}
        position={[1.489, 0, -1.924]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('broken_concrete_debris.glb'));
