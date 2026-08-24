import React from 'react';

import { FUR_TECHNIQUES } from './furUtils';
import ShellFurGPU from './shell/ShellFurGPU';
import StrandFurGPU from './strand/StrandFurGPU';
import useResolvedFurSource from './useResolvedFurSource';

export default function FurGPU({
  technique = FUR_TECHNIQUES.strand,
  sourceGeometry = null,
  sourceMaterial = null,
  sourceMesh = null,
  ...props
}) {
  const source = useResolvedFurSource({
    sourceGeometry,
    sourceMaterial,
    sourceMesh,
  });

  if (!source.geometry) {
    return null;
  }

  if (technique === FUR_TECHNIQUES.shell) {
    return <ShellFurGPU {...props} source={source} />;
  }

  if (technique === FUR_TECHNIQUES.strand) {
    return <StrandFurGPU {...props} source={source} />;
  }

  return null;
}
