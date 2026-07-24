import React, { useEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import Fur from '../../../../../elements/fur/Fur';
import {
  PATCH_HEIGHT,
  PATCH_RADIUS,
  createDomeGeometry,
} from '../utils/grassPatch';
import GrassPatchGL from './GrassPatchGL';
import GrassPatchGPU from './GrassPatchGPU';

export default function GrassPatch({
  colorDark = '#3d5f29',
  colorLight = '#82ad4a',
  floorY,
  furProps = null,
  furLayers: furLayersProp = null,
  height = PATCH_HEIGHT,
  radius = PATCH_RADIUS,
  technique = null,
}) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;
  const surfaceRef = useRef();
  const furLayers =
    furLayersProp ?? (furProps && technique ? [{ furProps, technique }] : []);
  const geometry = useMemo(
    () => createDomeGeometry({ height, radius }),
    [height, radius]
  );
  const SurfaceComponent = isWebGPU ? GrassPatchGPU : GrassPatchGL;

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  return (
    <group>
      <SurfaceComponent
        colorDark={colorDark}
        colorLight={colorLight}
        floorY={floorY}
        geometry={geometry}
        ref={surfaceRef}
      />

      {furLayers.map((layer) => (
        <Fur
          key={layer.technique}
          sourceMesh={surfaceRef}
          technique={layer.technique}
          {...layer.furProps}
        />
      ))}
    </group>
  );
}
