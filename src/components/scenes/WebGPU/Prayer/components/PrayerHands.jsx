/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useLayoutEffect } from 'react';

import ensurePrayerGradientAttribute from '../utils/ensurePrayerGradientAttribute';
import { applyCorrections } from '../utils/posedHands';

function PrayerHands({
  posed,
  matrix,
  corrections,
  material,
  withGradient = false,
}) {
  useEffect(() => {
    posed.clone.traverse((node) => {
      if (!node.isMesh) return;
      if (withGradient) ensurePrayerGradientAttribute(node.geometry);
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
      if (material) node.material = material;
    });
  }, [posed, material, withGradient]);

  useLayoutEffect(() => {
    applyCorrections(posed.clone, posed.hands, matrix, corrections);
  }, [posed, matrix, corrections]);

  return (
    <group matrix={matrix} matrixAutoUpdate={false} dispose={null}>
      <primitive object={posed.clone} />
    </group>
  );
}

export default memo(PrayerHands);
