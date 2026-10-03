import { useCallback, useEffect, useState } from 'react';

import { request } from '@dev/renderWorkbench/useRenderJobs';

const ENDPOINT = '/dev-api/darkroom/sources';

// Every picked file and recorded take is uploaded once (content-addressed),
// so a clip shot on the phone shows up on the desktop, and an export can mux
// the clip's own audio.
export default function useSourceLibrary() {
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setSources((await request(ENDPOINT)).sources);
      setError(null);
    } catch (failure) {
      setError(failure.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (blob) => {
      const { source } = await request(ENDPOINT, {
        body: blob,
        headers: { 'Content-Type': blob.type },
        method: 'POST',
      });
      refresh();
      return source;
    },
    [refresh]
  );

  const remove = useCallback(async (name) => {
    setSources(
      (await request(`${ENDPOINT}/${name}`, { method: 'DELETE' })).sources
    );
  }, []);

  return { error, refresh, remove, sources, upload };
}
