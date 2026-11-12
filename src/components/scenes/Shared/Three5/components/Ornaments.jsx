import React, { memo, useEffect, useMemo, useRef } from 'react';

import { DoubleSide, Object3D, Vector3 } from 'three';

import ornamentGeometry from '../utils/ornamentGeometry';

function Ornaments({ shape, ornaments, assets, config }) {
  const instances = useRef();
  const isCard = shape === 'petal';
  const geometry = useMemo(() => ornamentGeometry(shape), [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const pose = new Object3D();
    const up = new Vector3(0, 1, 0);
    const direction = new Vector3();
    ornaments.forEach((ornament, index) => {
      pose.position.fromArray(ornament.position);
      pose.scale.setScalar(
        ornament.birth <= config.growth ? Math.max(0.07, ornament.size) : 0
      );
      if (ornament.direction)
        pose.quaternion.setFromUnitVectors(
          up,
          direction.fromArray(ornament.direction).normalize()
        );
      else pose.rotation.set(index, index * 0.4, 0);
      pose.updateMatrix();
      instances.current.setMatrixAt(index, pose.matrix);
    });
    instances.current.count = ornaments.length;
    instances.current.instanceMatrix.needsUpdate = true;
    instances.current.computeBoundingSphere();
  }, [ornaments, config.growth]);
  return (
    <instancedMesh ref={instances} args={[geometry, null, 180]}>
      {isCard ? (
        <meshBasicMaterial
          map={assets.spriteTexture}
          transparent
          alphaTest={0.01}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      ) : (
        <meshStandardMaterial
          map={assets.mainTexture}
          bumpMap={assets.heightTexture}
          bumpScale={config.bump}
          roughness={config.roughness}
        />
      )}
    </instancedMesh>
  );
}

export default memo(Ornaments);
