import React from 'react';

import { FUR_TECHNIQUES } from './furUtils';
import ShellFurGL from './shell/ShellFurGL';
import StrandFurGL from './strand/StrandFurGL';
import useResolvedFurSource from './useResolvedFurSource';

export default function FurGL({
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
    return <ShellFurGL {...props} source={source} />;
  }

  if (technique === FUR_TECHNIQUES.strand) {
    return <StrandFurGL {...props} source={source} />;
  }

  return null;
}
