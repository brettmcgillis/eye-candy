import * as THREE from 'three';

import React, { useLayoutEffect, useRef, useState } from 'react';

import SevenEleven from '../../../../../elements/sevenEleven/SevenEleven';

const DEFAULT_STORE_SCALE = 320;
const DEFAULT_STORE_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_STORE_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });

function toPositionArray(vector = DEFAULT_STORE_POSITION) {
  return [vector.x ?? 0, vector.y ?? 0, vector.z ?? 0];
}

function toRotationArray(rotation = DEFAULT_STORE_ROTATION) {
  return [rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0].map(
    THREE.MathUtils.degToRad
  );
}

export default function SevenElevenStage({
  onStoreSpaceChange = null,
  storeScale = DEFAULT_STORE_SCALE,
  storePosition = DEFAULT_STORE_POSITION,
  storeRotation = DEFAULT_STORE_ROTATION,
}) {
  const offsetGroupRef = useRef(null);
  const storeRootRef = useRef(null);
  const [offset, setOffset] = useState([0, 0, 0]);

  useLayoutEffect(() => {
    if (!storeRootRef.current || !offsetGroupRef.current) return;

    storeRootRef.current.updateWorldMatrix(true, true);

    const centerStoreRef =
      storeRootRef.current.getObjectByName('CenterStoreRef');

    if (centerStoreRef) {
      const anchorWorldPosition = centerStoreRef.getWorldPosition(
        new THREE.Vector3()
      );
      const anchorOffset =
        offsetGroupRef.current.worldToLocal(anchorWorldPosition);

      setOffset([-anchorOffset.x, -anchorOffset.y, -anchorOffset.z]);
      return;
    }

    const box = new THREE.Box3().setFromObject(storeRootRef.current);

    if (box.isEmpty()) return;

    const center = offsetGroupRef.current.worldToLocal(
      box.getCenter(new THREE.Vector3())
    );
    setOffset([-center.x, -center.y, -center.z]);
  }, [storeScale]);

  useLayoutEffect(() => {
    if (!onStoreSpaceChange || !storeRootRef.current) return;

    storeRootRef.current.updateWorldMatrix(true, true);

    const storeLocalToWorldMatrix = storeRootRef.current.matrixWorld.clone();
    const centerStoreRef =
      storeRootRef.current.getObjectByName('CenterStoreRef');
    const centerStoreRefWorldPosition = new THREE.Vector3();

    if (centerStoreRef) {
      centerStoreRef.getWorldPosition(centerStoreRefWorldPosition);
    }

    onStoreSpaceChange({
      centerStoreRefWorldPosition,
      storeLocalToWorldMatrix,
    });
  }, [
    offset,
    onStoreSpaceChange,
    storePosition.x,
    storePosition.y,
    storePosition.z,
    storeRotation.x,
    storeRotation.y,
    storeRotation.z,
    storeScale,
  ]);

  return (
    <group
      position={toPositionArray(storePosition)}
      rotation={toRotationArray(storeRotation)}
    >
      <group ref={offsetGroupRef} position={offset}>
        <group ref={storeRootRef} scale={storeScale}>
          <SevenEleven />
        </group>
      </group>
    </group>
  );
}
