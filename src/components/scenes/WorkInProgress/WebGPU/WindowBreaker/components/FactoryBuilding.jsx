import { memo, useEffect, useRef } from 'react';

import { RigidBody } from '@react-three/rapier';

import Factory from '../../../../../elements/Factory/Factory';

// Renders the abandoned factory (baked windows hidden — procedural ones take
// their place) with a trimesh collider so rocks bounce off the walls and pass
// through the window openings. Its solid meshes are also tagged as raycast
// targets so a rock striking a wall triggers the concrete impact sound.
// Children (the procedural windows) share the same transform.
function FactoryBuilding({ building, wallMeshesRef, children }) {
  const groupRef = useRef(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || !wallMeshesRef) {
      return undefined;
    }

    const meshes = [];
    group.traverse((object) => {
      if (object.isMesh && !object.userData?.surfaceType) {
        const mesh = object;
        mesh.userData = { ...mesh.userData, surfaceType: 'wall' };
        meshes.push(mesh);
      }
    });
    wallMeshesRef.current = meshes;

    return () => {
      wallMeshesRef.current = [];
    };
  }, [wallMeshesRef, building.scale]);

  return (
    <group
      ref={groupRef}
      position={building.position}
      rotation={building.rotation}
      scale={building.scale}
      visible={building.visible}
    >
      <RigidBody
        type="fixed"
        colliders="trimesh"
        friction={1}
        restitution={0.2}
      >
        <Factory showWindows={false} />
      </RigidBody>
      {children}
    </group>
  );
}

export default memo(FactoryBuilding);
