import { Float32BufferAttribute } from 'three';

import React, { memo, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../../../utils/appUtils';

const MODEL = modelFile('prayingHands.glb');
const TARGET_MAX_DIMENSION = 1.4;
const PRAYER_GRADIENT_ATTRIBUTE = 'prayerGradient';
const EDGE_SAMPLE_FRACTION = 0.1;

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

function getAxisValueFromBox(box, axisIndex, edge) {
  if (axisIndex === 0) return edge === 'min' ? box.min.x : box.max.x;
  if (axisIndex === 1) return edge === 'min' ? box.min.y : box.max.y;
  return edge === 'min' ? box.min.z : box.max.z;
}

function getPositionAxisValue(positionAttribute, vertexIndex, axisIndex) {
  if (axisIndex === 0) return positionAttribute.getX(vertexIndex);
  if (axisIndex === 1) return positionAttribute.getY(vertexIndex);
  return positionAttribute.getZ(vertexIndex);
}

function getPerpendicularAxisValues(positionAttribute, vertexIndex, axisIndex) {
  if (axisIndex === 0) {
    return [
      positionAttribute.getY(vertexIndex),
      positionAttribute.getZ(vertexIndex),
    ];
  }

  if (axisIndex === 1) {
    return [
      positionAttribute.getX(vertexIndex),
      positionAttribute.getZ(vertexIndex),
    ];
  }

  return [
    positionAttribute.getX(vertexIndex),
    positionAttribute.getY(vertexIndex),
  ];
}

function getDominantAxisIndex(box) {
  const spans = [
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z,
  ];

  if (spans[1] > spans[0] && spans[1] >= spans[2]) return 1;
  if (spans[2] > spans[0] && spans[2] > spans[1]) return 2;
  return 0;
}

function measureSliceArea(
  positionAttribute,
  axisIndex,
  edgeValue,
  sliceSpan,
  edge
) {
  let minA = Infinity;
  let maxA = -Infinity;
  let minB = Infinity;
  let maxB = -Infinity;
  let sampleCount = 0;

  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex += 1
  ) {
    const axisValue = getPositionAxisValue(
      positionAttribute,
      vertexIndex,
      axisIndex
    );
    const inSlice =
      edge === 'min'
        ? axisValue <= edgeValue + sliceSpan
        : axisValue >= edgeValue - sliceSpan;

    if (inSlice) {
      const [valueA, valueB] = getPerpendicularAxisValues(
        positionAttribute,
        vertexIndex,
        axisIndex
      );

      minA = Math.min(minA, valueA);
      maxA = Math.max(maxA, valueA);
      minB = Math.min(minB, valueB);
      maxB = Math.max(maxB, valueB);
      sampleCount += 1;
    }
  }

  if (!sampleCount) return 0;
  return Math.max(maxA - minA, 0) * Math.max(maxB - minB, 0);
}

function ensurePrayerGradientAttribute(geometry) {
  if (!geometry || geometry.getAttribute(PRAYER_GRADIENT_ATTRIBUTE)) {
    return geometry;
  }

  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) return geometry;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;

  const axisIndex = getDominantAxisIndex(box);
  const min = getAxisValueFromBox(box, axisIndex, 'min');
  const max = getAxisValueFromBox(box, axisIndex, 'max');
  const span = Math.max(max - min, 1e-6);
  const sliceSpan = Math.max(span * EDGE_SAMPLE_FRACTION, 1e-6);
  const minSliceArea = measureSliceArea(
    positionAttribute,
    axisIndex,
    min,
    sliceSpan,
    'min'
  );
  const maxSliceArea = measureSliceArea(
    positionAttribute,
    axisIndex,
    max,
    sliceSpan,
    'max'
  );
  const wristAtMin = minSliceArea > maxSliceArea;
  const gradientValues = new Float32Array(positionAttribute.count);

  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex += 1
  ) {
    const axisValue = getPositionAxisValue(
      positionAttribute,
      vertexIndex,
      axisIndex
    );
    const normalized = (axisValue - min) / span;

    gradientValues[vertexIndex] = wristAtMin ? 1 - normalized : normalized;
  }

  geometry.setAttribute(
    PRAYER_GRADIENT_ATTRIBUTE,
    new Float32BufferAttribute(gradientValues, 1)
  );

  return geometry;
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

  const leftGeometry = useMemo(() => {
    return ensurePrayerGradientAttribute(nodes?.Hand_L?.geometry);
  }, [nodes]);

  const rightGeometry = useMemo(() => {
    return ensurePrayerGradientAttribute(nodes?.Hand_R?.geometry);
  }, [nodes]);

  if (!leftGeometry || !rightGeometry) return null;

  const axisVector = useMemo(() => {
    return spreadAxis === 'x' ? [1, 0, 0] : [0, 0, 1];
  }, [spreadAxis]);

  const modelScale = useMemo(() => {
    const maxDimension = Math.max(
      getGeometryMaxDimension(leftGeometry),
      getGeometryMaxDimension(rightGeometry)
    );
    return TARGET_MAX_DIMENSION / maxDimension;
  }, [leftGeometry, rightGeometry]);

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
        geometry={leftGeometry}
        material={material}
        position={leftOffset}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={rightGeometry}
        material={material}
        position={rightOffset}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(MODEL);

export default memo(HandsPair);
