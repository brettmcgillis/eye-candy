import { useCallback, useEffect, useState } from 'react';

const API = '/dev-api/trucheterie-designer/designs';

async function request(url, init) {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!body.ok) throw new Error(body.message ?? 'Request failed.');
  return body;
}

export default function useSavedDesigns() {
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setDesigns((await request(API)).designs);
      setError(null);
    } catch (failure) {
      setError(failure.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const load = useCallback(
    async (name) =>
      (await request(`${API}/${encodeURIComponent(name)}`)).design,
    []
  );

  const save = useCallback(
    async (name, json) => {
      await request(`${API}/${encodeURIComponent(name)}`, {
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      });
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (name) => {
      await request(`${API}/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await refresh();
    },
    [refresh]
  );

  return { designs, error, load, refresh, remove, save };
}
