import { useLayoutEffect, useMemo, useState } from 'react';

import {
  findFurSourceMesh,
  getFirstMaterial,
  resolveGeometryRadius,
  resolveMaterialColor,
  resolveMaterialMap,
} from './furUtils';

export default function useResolvedFurSource({
  sourceGeometry = null,
  sourceMaterial = null,
  sourceMesh = null,
}) {
  const [resolvedMesh, setResolvedMesh] = useState(() =>
    findFurSourceMesh(sourceMesh)
  );

  useLayoutEffect(() => {
    const nextMesh = findFurSourceMesh(sourceMesh);

    if (nextMesh !== resolvedMesh) {
      setResolvedMesh(nextMesh);
    }
  }, [resolvedMesh, sourceMesh]);

  return useMemo(() => {
    const material =
      getFirstMaterial(sourceMaterial) ||
      getFirstMaterial(resolvedMesh?.material);

    return {
      baseColor: resolveMaterialColor(material),
      geometry: sourceGeometry || resolvedMesh?.geometry || null,
      isSkinnedMesh: resolvedMesh?.isSkinnedMesh === true,
      map: resolveMaterialMap(material),
      material,
      mesh: resolvedMesh,
      radius: resolveGeometryRadius(sourceGeometry || resolvedMesh?.geometry),
    };
  }, [resolvedMesh, sourceGeometry, sourceMaterial]);
}
