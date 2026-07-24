import * as THREE from 'three';

import React, { useLayoutEffect, useRef, useState } from 'react';

import Fur from '../../../../../elements/fur/Fur';
import Rabbit from '../../../../../elements/rabbit/Rabbit';
import { PATCH_HEIGHT } from '../utils/grassPatch';
import GrassPatch from './GrassPatch';

const Y_EPSILON = 1e-4;

function resolveScaleY(scale) {
  if (typeof scale === 'number') {
    return scale;
  }

  if (Array.isArray(scale)) {
    const scaleY = scale[1] ?? scale[0];

    return Number.isFinite(scaleY) ? scaleY : 1;
  }

  if (scale && typeof scale === 'object' && Number.isFinite(scale.y)) {
    return scale.y;
  }

  return 1;
}

export default function Specimen({
  floorY,
  furProps = null,
  furLayers: furLayersProp = null,
  offsetY,
  patchProps = null,
  patchFurProps = null,
  patchFurLayers: patchFurLayersProp = null,
  position,
  rotationY,
  scale,
  technique = null,
}) {
  const groupRef = useRef();
  const rabbitRef = useRef();
  const patchHeight = patchProps?.height ?? PATCH_HEIGHT;
  const rabbitContactOffset = patchProps?.contactOffset ?? 0;
  const [rabbitY, setRabbitY] = useState(floorY + patchHeight);
  const furLayers =
    furLayersProp ?? (furProps && technique ? [{ furProps, technique }] : []);
  const patchFurLayers =
    patchFurLayersProp ??
    (patchFurProps && technique
      ? [{ furProps: patchFurProps, technique }]
      : []);

  useLayoutEffect(() => {
    if (!groupRef.current || !rabbitRef.current) {
      return;
    }

    const rabbitBox = new THREE.Box3();
    const rabbitWorldPosition = new THREE.Vector3();
    const fineTuneOffset = offsetY * resolveScaleY(scale);

    rabbitRef.current.updateWorldMatrix(true, true);
    rabbitBox.setFromObject(rabbitRef.current);
    rabbitRef.current.getWorldPosition(rabbitWorldPosition);

    const localBottomOffset = rabbitBox.min.y - rabbitWorldPosition.y;
    const nextRabbitY =
      floorY +
      patchHeight -
      localBottomOffset +
      fineTuneOffset +
      rabbitContactOffset;

    setRabbitY((currentY) =>
      Math.abs(currentY - nextRabbitY) <= Y_EPSILON ? currentY : nextRabbitY
    );
  }, [floorY, offsetY, patchHeight, rabbitContactOffset, scale]);

  return (
    <group position={position} ref={groupRef}>
      <GrassPatch {...patchProps} floorY={floorY} furLayers={patchFurLayers} />

      <Rabbit
        autoPlay
        autoPlayPatterns={['rabbit', 'eat']}
        autoPlayTimeScale={0.6}
        position={[0, rabbitY, 0]}
        ref={rabbitRef}
        rotation={[0, rotationY, 0]}
        scale={scale}
      />

      {furLayers.map((layer) => (
        <Fur
          key={layer.technique}
          sourceMesh={rabbitRef}
          technique={layer.technique}
          {...layer.furProps}
        />
      ))}
    </group>
  );
}
