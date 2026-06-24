import React, { memo, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../../../utils/appUtils';

const MODEL = modelFile('prayingHands.glb');
const TARGET_MAX_DIMENSION = 1.4;

function getGeometryMaxDimension(geometry) {
  if (!geometry) return 1;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return 1;
  const x = box.max.x - box.min.x;
  const y = box.max.y - box.min.y;
  const z = box.max.z - box.min.z;
  return Math.max(x, y, z, 1e-6);
}

function composeScale(scale, modelScale) {
  if (Array.isArray(scale)) {
    return scale.map((value) => value * modelScale);
  }

  if (typeof scale === 'number') {
    return scale * modelScale;
  }

  return modelScale;
}
function HandsPair({
  material,
  spread = 0,
  spreadAxis = 'z',
  spreadDirection = 1,
  ...props
}) {
  const { scale, ...groupProps } = props;
  const { nodes } = useGLTF(MODEL);
  if (!nodes?.Hand_L?.geometry || !nodes?.Hand_R?.geometry) return null;

  const axisVector = useMemo(() => {
    return spreadAxis === 'x' ? [1, 0, 0] : [0, 0, 1];
  }, [spreadAxis]);

  const modelScale = useMemo(() => {
    const maxDimension = Math.max(
      getGeometryMaxDimension(nodes.Hand_L.geometry),
      getGeometryMaxDimension(nodes.Hand_R.geometry)
    );
    return TARGET_MAX_DIMENSION / maxDimension;
  }, [nodes]);

  const composedScale = useMemo(() => {
    return composeScale(scale, modelScale);
  }, [scale, modelScale]);

  const leftOffset = useMemo(() => {
    return [
      axisVector[0] * spread * spreadDirection,
      axisVector[1] * spread * spreadDirection,
      axisVector[2] * spread * spreadDirection,
    ];
  }, [spread, axisVector, spreadDirection]);

  const rightOffset = useMemo(() => {
    return [
      -axisVector[0] * spread * spreadDirection,
      -axisVector[1] * spread * spreadDirection,
      -axisVector[2] * spread * spreadDirection,
    ];
  }, [spread, axisVector, spreadDirection]);

  return (
    <group {...groupProps} dispose={null} scale={composedScale}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Hand_L.geometry}
        material={material}
        position={leftOffset}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Hand_R.geometry}
        material={material}
        position={rightOffset}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(MODEL);

export default memo(HandsPair);
