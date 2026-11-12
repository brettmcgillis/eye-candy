import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { DoubleSide, LessDepth, Matrix4, Vector3 } from 'three';

function CutPaperLeaf({ geometry, silhouette, index, config, assets, time }) {
  const root = useRef();
  const sway = useRef();
  const leaf = useRef();
  const last = useRef(Infinity);
  const data = useMemo(
    () => ({
      geometry: silhouette.clone(),
      matrix: new Matrix4(),
      point: new Vector3(),
    }),
    [silhouette]
  );
  useEffect(() => () => data.geometry.dispose(), [data]);
  useFrame(() => {
    if (last.current === time.current) return;
    last.current = time.current;
    sway.current.rotation.y = Math.sin(time.current) * 0.3;
    leaf.current.updateWorldMatrix(true, false);
    data.matrix
      .copy(root.current.matrixWorld)
      .invert()
      .multiply(leaf.current.matrixWorld);
    const source = silhouette.attributes.position;
    const output = data.geometry.attributes.position;
    for (let i = 0; i < source.count; i += 1) {
      data.point.fromBufferAttribute(source, i).applyMatrix4(data.matrix);
      const fall = data.point.y + 2.4;
      output.setXYZ(i, data.point.x, -2.39, data.point.z - (fall * 5) / 6);
    }
    output.needsUpdate = true;
  });
  return (
    <group ref={root}>
      <group ref={sway}>
        <mesh
          ref={leaf}
          geometry={geometry}
          position={[
            ((index % 3) - 1) * 1.1,
            -0.5 + (index % 2) * 0.7,
            -index * 0.45,
          ]}
          rotation={[
            0.05 * index,
            ((index % 3) - 1) * 0.25,
            (index % 2 ? 1 : -1) * 0.3,
          ]}
          scale={0.95}
        >
          <meshStandardMaterial
            attach="material-0"
            map={assets.spriteTexture}
            transparent
            alphaTest={0.1}
            side={DoubleSide}
            roughness={0.95}
          />
          <meshStandardMaterial
            attach="material-1"
            color={config.paper}
            roughness={1}
            side={DoubleSide}
          />
        </mesh>
      </group>
      {config.cutShadows && (
        <mesh geometry={data.geometry} frustumCulled={false} renderOrder={1}>
          <meshBasicMaterial
            color="#554e44"
            transparent
            opacity={0.18}
            side={DoubleSide}
            depthWrite
            depthFunc={LessDepth}
          />
        </mesh>
      )}
    </group>
  );
}
export default memo(CutPaperLeaf);
