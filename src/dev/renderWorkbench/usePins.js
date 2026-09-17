import { useCallback, useMemo, useState } from 'react';

// Which rollable options the user has taken control of. Everything the dice
// can set starts unpinned; pinning is what turns a shown value into a held
// one. `facets` are the shortcut for holding a whole look at once.
export default function usePins({ facets, keysInFacet, specs }) {
  const [pins, setPins] = useState(() => new Set());

  const toggle = useCallback(
    (option) =>
      setPins((current) => {
        const next = new Set(current);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        return next;
      }),
    []
  );

  const toggleFacet = useCallback(
    (facet) => {
      const keys = keysInFacet(facet);
      setPins((current) => {
        const next = new Set(current);
        const allOn = keys.every((key) => next.has(key));
        keys.forEach((key) => (allOn ? next.delete(key) : next.add(key)));
        return next;
      });
    },
    [keysInFacet]
  );

  const clear = useCallback(() => setPins(new Set()), []);

  const heldFacets = useMemo(
    () =>
      facets.filter((facet) =>
        keysInFacet(facet).every((key) => pins.has(key))
      ),
    [facets, keysInFacet, pins]
  );

  const context = useMemo(
    () => ({ pins, specs, toggle }),
    [pins, specs, toggle]
  );

  // The server forwards exactly what it is sent and the CLI reads a forwarded
  // flag as a pin, so an unpinned rollable field is left off the payload
  // rather than silently held at whatever the form shows.
  const chosen = useCallback(
    (options) =>
      Object.fromEntries(
        Object.entries(options).filter(
          ([key]) => !specs[key]?.facet || pins.has(key)
        )
      ),
    [pins, specs]
  );

  return {
    chosen,
    clear,
    context,
    heldFacets,
    pins,
    setPins,
    toggle,
    toggleFacet,
  };
}
