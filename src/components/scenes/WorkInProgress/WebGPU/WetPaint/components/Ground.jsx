import * as THREE from 'three';

import React, { memo, useLayoutEffect, useMemo, useRef } from 'react';

import { useGLTF, useTexture } from '@react-three/drei';

import { modelFile, textureFile } from '../../../../../../utils/appUtils';
import { SIDEWALK_DEPTH, SIDEWALK_HEIGHT } from '../utils/sceneUtils';
import PaintDecal from './PaintDecal';

const GROUND_ROTATION = [-Math.PI / 2, 0, 0];
const CURB_FILE = 'SidewalkCrackedCurb.glb';
const CURB_NODE = 'SidewalkCracked_SidewalkMat_0';

// Measured from SidewalkCrackedCurb.glb: each "curb" piece is actually a
// full sidewalk slab, 2.009 wide x 0.149 thick x 2.207 deep (thickness/
// depth live in utils/sceneUtils.js as SIDEWALK_HEIGHT/DEPTH since placement
// elsewhere depends on them). The previous tiling treated it as a thin strip
// centered on the wall line, which is why slabs overlapped each other, the
// wall, and the asphalt (todo item 44).
const SLAB_WIDTH = 2.009;

// Sidewalk slabs tiled flush edge-to-edge along the wall (todo item 38),
// raised so they sit ON the asphalt rather than straddling y=0.
function SidewalkRow({ material, sourceGeometry, width }) {
  const meshRef = useRef(null);

  const { geometry, positions } = useMemo(() => {
    const centered = sourceGeometry.clone();
    centered.computeBoundingBox();
    const { min, max } = centered.boundingBox;
    // Recentre x/z, and lift so the slab's underside sits at local y=0.
    centered.translate(-(min.x + max.x) / 2, -min.y, -(min.z + max.z) / 2);

    const columns = Math.max(1, Math.ceil(width / SLAB_WIDTH));
    const startX = -((columns - 1) * SLAB_WIDTH) / 2;

    return {
      geometry: centered,
      positions: Array.from(
        { length: columns },
        (_, i) => startX + i * SLAB_WIDTH
      ),
    };
  }, [sourceGeometry, width]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach((x, index) => {
      dummy.position.set(x, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, positions.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

// Street floor: a sidewalk-slab strip against the wall (z 0..SIDEWALK_DEPTH,
// raised SIDEWALK_HEIGHT) and asphalt beyond it. Two paint decals — one on
// the sidewalk top (fixes "can't paint on curbs", todo item 46) and one on
// the asphalt — both drip-free (todo item 29, horizontal surfaces).
function Ground({ depth = 10, width = 14 }) {
  const [diffuseMap, roughnessMap] = useTexture([
    textureFile('asphalt/asphalt_02_diff_1k.jpg'),
    textureFile('asphalt/asphalt_02_rough_1k.jpg'),
  ]);
  const { materials, nodes } = useGLTF(modelFile(CURB_FILE));

  useMemo(() => {
    // Textures are mutable config objects in three.js — configuring the
    // loaded map in place is the idiomatic pattern here, not an accidental
    // parameter mutation.
    /* eslint-disable no-param-reassign */
    [diffuseMap, roughnessMap].forEach((map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(width / 4, depth / 4);
      map.colorSpace =
        map === diffuseMap ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    });
    /* eslint-enable no-param-reassign */
  }, [depth, diffuseMap, roughnessMap, width]);

  const asphaltDepth = Math.max(0.1, depth - SIDEWALK_DEPTH);

  return (
    <group>
      <mesh
        rotation={GROUND_ROTATION}
        position={[0, 0, depth / 2]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={diffuseMap} roughnessMap={roughnessMap} />
      </mesh>

      <group position={[0, 0, SIDEWALK_DEPTH / 2]}>
        <SidewalkRow
          sourceGeometry={nodes[CURB_NODE].geometry}
          material={materials.SidewalkMat}
          width={width}
        />
      </group>

      <PaintDecal
        width={width}
        height={SIDEWALK_DEPTH}
        dripEnabled={false}
        rotation={GROUND_ROTATION}
        position={[0, SIDEWALK_HEIGHT + 0.006, SIDEWALK_DEPTH / 2]}
      />
      {/* The curb's vertical front face (todo item 68) — the slabs are
          instanced so they can't take a PaintableShell; a thin decal strip
          along the curb line covers the face the player actually sees. */}
      <PaintDecal
        width={width}
        height={SIDEWALK_HEIGHT}
        dripEnabled={false}
        position={[0, SIDEWALK_HEIGHT / 2, SIDEWALK_DEPTH + 0.006]}
      />
      <PaintDecal
        width={width}
        height={asphaltDepth}
        dripEnabled={false}
        rotation={GROUND_ROTATION}
        position={[0, 0.006, SIDEWALK_DEPTH + asphaltDepth / 2]}
      />
    </group>
  );
}

export default memo(Ground);

useGLTF.preload(modelFile(CURB_FILE));
