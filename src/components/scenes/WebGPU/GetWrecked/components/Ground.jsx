import React, { memo, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import createAsphaltMaterial, {
  createAsphaltUniforms,
} from '../utils/asphaltMaterial';

// The layout's city extents aren't a size, they're a phase: the material reads
// `mod(worldPos + cityExtent / 2, blockSize + streetWidth)`, so these two
// derivations are what park the origin mid-street across X (centre line running
// down Z, where the vehicles sit) and mid-block along Z — which is also what
// keeps the crosswalk bars away from the subject, since they only draw within
// `crosswalkWidth` of a block edge.
function buildLayout(blockSize, streetWidth) {
  return {
    blockW: blockSize,
    blockD: blockSize,
    street: streetWidth,
    cityW: 2 * blockSize + streetWidth,
    cityD: blockSize,
  };
}

function Ground({ config }) {
  const uniforms = useMemo(() => createAsphaltUniforms(), []);

  // Block size and street width are the grid the marking maths is built
  // around, so they're baked into the node graph rather than uniforms — moving
  // them rebuilds the material, everything else is live.
  const material = useMemo(
    () =>
      createAsphaltMaterial(
        buildLayout(config.groundBlockSize, config.groundStreetWidth),
        uniforms
      ),
    [config.groundBlockSize, config.groundStreetWidth, uniforms]
  );

  useFrame(() => {
    uniforms.colorDark.value.set(config.groundColorDark);
    uniforms.colorLight.value.set(config.groundColorLight);
    uniforms.patchScale.value = config.groundPatchScale;
    uniforms.gritScale.value = config.groundGritScale;
    uniforms.gritAmount.value = config.groundGritAmount;
    uniforms.stainScale.value = config.groundStainScale;
    uniforms.stainAmount.value = config.groundStainAmount;
    uniforms.crackScale.value = config.groundCrackScale;
    uniforms.crackAmount.value = config.groundCrackAmount;
    uniforms.wetScale.value = config.groundWetScale;
    uniforms.wetAmount.value = config.groundWetAmount;
    uniforms.wetRoughness.value = config.groundWetRoughness;
    uniforms.roughness.value = config.groundRoughness;
    uniforms.paintColor.value.set(config.groundPaintColor);
    uniforms.paintWidth.value = config.groundPaintWidth;
    uniforms.paintWear.value = config.groundPaintWear;
    uniforms.dashPeriod.value = config.groundDashPeriod;
    uniforms.crosswalkWidth.value = config.groundCrosswalkWidth;
    uniforms.detailNear.value = config.groundDetailNear;
    uniforms.detailFar.value = config.groundDetailFar;
    uniforms.bump.value = config.groundBump;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={material}>
      <planeGeometry args={[config.groundSize, config.groundSize]} />
    </mesh>
  );
}

export default memo(Ground);
