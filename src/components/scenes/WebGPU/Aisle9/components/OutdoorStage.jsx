import React, { useMemo, useRef } from 'react';

import Aisle9Store from '@elements/Aisle9Store/Aisle9Store';

import useStoreAnchor from '../hooks/useStoreAnchor';
import { toRotationArray, toVectorArray } from '../utils/vectors';

const DEFAULT_STORE_SCALE = 320;
const DEFAULT_STORE_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_STORE_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });

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
    onOutdoorLightPositionsChange,
  });

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
