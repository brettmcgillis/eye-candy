import { useEffect, useMemo } from 'react';

export default function useMaterialVariants(source, transform) {
  const materials = useMemo(
    () =>
      transform
        ? Object.fromEntries(
            Object.entries(source).map(([key, material]) => [
              key,
              transform(material, key),
            ])
          )
        : source,
    [source, transform]
  );
  useEffect(
    () => () => {
      if (materials !== source)
        Object.values(materials).forEach((material) => material.dispose());
    },
    [materials, source]
  );
  return materials;
}
