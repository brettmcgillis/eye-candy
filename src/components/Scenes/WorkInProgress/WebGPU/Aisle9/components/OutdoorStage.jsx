import * as THREE from 'three';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import Aisle9Store from '../../../../../elements/Aisle9Store/Aisle9Store';

const DEFAULT_STORE_SCALE = 320;
const DEFAULT_STORE_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_STORE_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });

function toVectorArray(vector = DEFAULT_STORE_POSITION) {
  return [vector.x ?? 0, vector.y ?? 0, vector.z ?? 0];
}

function toRotationArray(rotation = DEFAULT_STORE_ROTATION) {
  return [rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0].map(
    THREE.MathUtils.degToRad
  );
}

export default function OutdoorStage({
  indoorEmissiveColor = '#fffbe0',
  indoorEmissiveIntensity = 0,
  onOutdoorLightPositionsChange = null,
  onStoreSpaceChange = null,
  outdoorEmissiveColor = '#ffcc44',
  outdoorEmissiveIntensity = 0,
  signEmissiveColor = '#ff6600',
  signGlowIntensity = 0,
  storePosition = DEFAULT_STORE_POSITION,
  storeRotation = DEFAULT_STORE_ROTATION,
  storeScale = DEFAULT_STORE_SCALE,
}) {
  const offsetGroupRef = useRef(null);
  const storeRootRef = useRef(null);
  const [offset, setOffset] = useState([0, 0, 0]);
  const position = useMemo(() => toVectorArray(storePosition), [storePosition]);
  const rotation = useMemo(
    () => toRotationArray(storeRotation),
    [storeRotation]
  );

  useLayoutEffect(() => {
    if (!offsetGroupRef.current || !storeRootRef.current) return;

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

    const localAnchor = offsetGroupRef.current.worldToLocal(
      box.getCenter(new THREE.Vector3())
    );
    setOffset([-localAnchor.x, -localAnchor.y, -localAnchor.z]);
  }, [storeScale]);

  useLayoutEffect(() => {
    if (!onStoreSpaceChange || !storeRootRef.current) return;

    storeRootRef.current.updateWorldMatrix(true, true);

    const centerStoreRef =
      storeRootRef.current.getObjectByName('CenterStoreRef');
    const centerStoreRefWorldPosition = new THREE.Vector3();

    if (centerStoreRef) {
      centerStoreRef.getWorldPosition(centerStoreRefWorldPosition);
    } else {
      const box = new THREE.Box3().setFromObject(storeRootRef.current);

      if (!box.isEmpty()) {
        box.getCenter(centerStoreRefWorldPosition);
      }
    }

    onStoreSpaceChange({
      centerStoreRefWorldPosition,
      storeLocalToWorldMatrix: storeRootRef.current.matrixWorld.clone(),
    });

    if (onOutdoorLightPositionsChange) {
      const box = new THREE.Box3();
      const center = new THREE.Vector3();
      const positions = [];
      storeRootRef.current.traverse((obj) => {
        if (!obj.isMesh) return;
        const mat = Array.isArray(obj.material)
          ? obj.material[0]
          : obj.material;
        if (mat?.name !== 'Lights_01') return;
        box.setFromObject(obj);
        if (!box.isEmpty()) {
          positions.push(box.getCenter(center.clone()).toArray());
        }
      });
      onOutdoorLightPositionsChange(positions);
    }
  }, [
    offset,
    onOutdoorLightPositionsChange,
    onStoreSpaceChange,
    position,
    rotation,
    storeScale,
  ]);

  return (
    <group position={position} rotation={rotation}>
      <group ref={offsetGroupRef} position={offset}>
        <group ref={storeRootRef} scale={storeScale}>
          <Aisle9Store
            indoorEmissiveColor={indoorEmissiveColor}
            indoorEmissiveIntensity={indoorEmissiveIntensity}
            outdoorEmissiveColor={outdoorEmissiveColor}
            outdoorEmissiveIntensity={outdoorEmissiveIntensity}
            signEmissiveColor={signEmissiveColor}
            signGlowIntensity={signGlowIntensity}
          />
        </group>
      </group>
    </group>
  );
}
