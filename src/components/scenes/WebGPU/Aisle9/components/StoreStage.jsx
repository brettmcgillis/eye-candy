import React, { useMemo, useRef } from 'react';

import SevenElevenLow from '@elements/SevenElevenLow/SevenElevenLow';

import useStoreAnchor from '../hooks/useStoreAnchor';
import { toRotationArray, toVectorArray } from '../utils/vectors';

const DEFAULT_STORE_SCALE = 320;
const DEFAULT_STORE_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_STORE_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });

export default function StoreStage({
  onStoreSpaceChange = null,
  storePosition = DEFAULT_STORE_POSITION,
  storeRotation = DEFAULT_STORE_ROTATION,
  storeScale = DEFAULT_STORE_SCALE,
}) {
  const offsetGroupRef = useRef(null);
  const storeRootRef = useRef(null);
  const position = useMemo(() => toVectorArray(storePosition), [storePosition]);
  const rotation = useMemo(
    () => toRotationArray(storeRotation),
    [storeRotation]
  );
  const offset = useStoreAnchor({
    storeRootRef,
    offsetGroupRef,
    storeScale,
    position,
    rotation,
    onStoreSpaceChange,
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={offsetGroupRef} position={offset}>
        <group ref={storeRootRef} scale={storeScale}>
          <SevenElevenLow />
        </group>
      </group>
    </group>
  );
}
