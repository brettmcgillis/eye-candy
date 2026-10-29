import { useCallback, useEffect, useState } from 'react';

export const API = '/dev-api/paper-cuts-designer/designs';
export async function designRequest(url, init) {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok || !body.ok)
    throw new Error(body.message ?? 'Design request failed.');
  return body;
}
export default function useSavedDesigns() {
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    try {
      setDesigns((await designRequest(API)).designs);
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
      (await designRequest(`${API}/${encodeURIComponent(name)}`)).design,
    []
  );
  const save = useCallback(
    async (name, design) => {
      await designRequest(`${API}/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      });
      await refresh();
    },
    [refresh]
  );
  const remove = useCallback(
    async (name) => {
      await designRequest(`${API}/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      await refresh();
    },
    [refresh]
  );
  return { designs, error, refresh, load, save, remove };
}
