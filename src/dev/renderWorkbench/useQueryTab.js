import { useCallback, useState } from 'react';

// Tab state mirrored into a query-string param so a hot reload (or a shared
// link) lands on the same tab. Unknown values fall back to the default.
export default function useQueryTab(param, defaultValue, allowed) {
  const [value, setValue] = useState(() => {
    const stored = new URLSearchParams(window.location.search).get(param);
    return stored && (!allowed || allowed.includes(stored))
      ? stored
      : defaultValue;
  });

  const set = useCallback(
    (next) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next === defaultValue) url.searchParams.delete(param);
      else url.searchParams.set(param, next);
      window.history.replaceState(window.history.state, '', url);
    },
    [param, defaultValue]
  );

  return [value, set];
}
