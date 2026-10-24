import React, { useMemo } from 'react';

import { DoubleSide } from 'three';

import CRTStaticMaterialComponent from '@materials/WebGL/crt/crtStaticMaterial';

export default function CRTStaticRing({
  position = [0, 1.5, -1],
  rotation = [Math.PI / 4, 0, 0],
  scale = 1,
  innerRadius = 0.5,
  outerRadius = 2,
  snowAmount = 1,
  snowScale = 180,
  snowSpeed = 1,
  snowSize = 240,
  snap = 24,
  bandStrength = 0.35,
  bandSpeed = 0.6,
  bandScale = 8,
  rfStrength = 0.25,
  rfScale = 22,
  rfSpeed = 0.4,
  curvature = 0.12,
  vignette = 0.75,
}) {
  const ringArgs = useMemo(() => {
    const segments = 64;
    return [innerRadius, outerRadius, segments];
  }, [innerRadius, outerRadius]);

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <ringGeometry args={ringArgs} />
      <CRTStaticMaterialComponent
        snowAmount={snowAmount}
        snowScale={snowScale}
        snowSpeed={snowSpeed}
        snowSize={snowSize}
        curvature={curvature}
        vignette={vignette}
        bandStrength={bandStrength}
        bandSpeed={bandSpeed}
        bandScale={bandScale}
        snap={snap}
        rfStrength={rfStrength}
        rfScale={rfScale}
        rfSpeed={rfSpeed}
        side={DoubleSide}
      />
    </mesh>
  );
}
