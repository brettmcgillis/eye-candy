import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

// Central registry of paintable/hoverable meshes. PaintRig raycasts against
// whatever is registered instead of hardcoded refs, so adding a paintable
// surface anywhere in the scene is just a usePaintTarget call — this is what
// lets "paint on everything" scale past wall+ground. `kind` separates real
// paint surfaces from color-select UI decals (hover reticle only, no stamp).
const PaintTargetsContext = createContext(null);

export function createPaintTargetsRegistry() {
  const entries = new Map();

  return {
    register(mesh, entry) {
      entries.set(mesh, entry);
    },
    unregister(mesh) {
      entries.delete(mesh);
    },
    getMeshes(kind) {
      const meshes = [];
      entries.forEach((entry, mesh) => {
        if (entry.kind === kind) meshes.push(mesh);
      });
      return meshes;
    },
    getEntry(mesh) {
      return entries.get(mesh);
    },
    clearAll() {
      entries.forEach((entry) => entry.clear?.());
    },
  };
}

export const PaintTargetsProvider = PaintTargetsContext.Provider;

export function usePaintTargetsRegistry() {
  const registry = useContext(PaintTargetsContext);
  if (!registry) {
    throw new Error('usePaintTargetsRegistry requires PaintTargetsProvider');
  }
  return registry;
}

// Registers meshRef.current for the mesh's lifetime. `stamp`/`clear` may be
// null for kind 'ui' (reticle hover only). `worldWidth` (meters spanned by
// the surface's full UV width, when known) lets PaintRig size the
// cross-surface spray footprint; surfaces without it fall back to a default.
export function usePaintTarget({
  clear,
  kind = 'paint',
  meshRef,
  stamp,
  worldWidth = null,
}) {
  const registry = usePaintTargetsRegistry();
  const handlersRef = useRef({ clear, stamp });
  handlersRef.current = { clear, stamp };

  const stableEntry = useMemo(
    () => ({
      kind,
      worldWidth,
      stamp: (args) => handlersRef.current.stamp?.(args),
      clear: () => handlersRef.current.clear?.(),
    }),
    [kind, worldWidth]
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return undefined;
    registry.register(mesh, stableEntry);
    return () => registry.unregister(mesh);
  }, [meshRef, registry, stableEntry]);
}
