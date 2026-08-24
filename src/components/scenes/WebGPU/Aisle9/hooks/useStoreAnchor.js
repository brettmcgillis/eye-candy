import { useLayoutEffect, useState } from 'react';

import * as THREE from 'three';

export default function useStoreAnchor({
  storeRootRef,
  offsetGroupRef,
  storeScale,
  position,
  rotation,
  onStoreSpaceChange,
  onOutdoorLightPositionsChange,
}) {
  const [offset, setOffset] = useState([0, 0, 0]);

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

  return offset;
}
