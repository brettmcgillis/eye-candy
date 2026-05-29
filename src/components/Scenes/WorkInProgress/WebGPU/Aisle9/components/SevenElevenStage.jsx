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
  storeScale = DEFAULT_STORE_SCALE,
  storePosition = DEFAULT_STORE_POSITION,
  storeRotation = DEFAULT_STORE_ROTATION,
}) {
  const contentRef = useRef(null);
  const [offset, setOffset] = useState([0, 0, 0]);

  useLayoutEffect(() => {
    if (!contentRef.current) return;

    contentRef.current.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(contentRef.current);

    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    setOffset([-center.x, -center.y, -center.z]);
  }, [storeScale]);

  return (
    <group
      position={toPositionArray(storePosition)}
      rotation={toRotationArray(storeRotation)}
    >
      <group position={offset}>
        <group ref={contentRef}>
          <SevenEleven scale={storeScale} />
        </group>
      </group>
    </group>
  );
}
