import { useCallback, useEffect, useRef, useState } from 'react';

const ENDPOINT = '/dev-api/rorschach/jobs';
const SAVED_ENDPOINT = '/dev-api/rorschach/saved';

async function request(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || 'Rorschach job request failed.');
  }
  return payload;
}

export default function useRorschachJobs() {
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedCollections, setSavedCollections] = useState([]);
  const jobsJsonRef = useRef('');
  const savedJsonRef = useRef('');

  const refreshJobs = useCallback(async () => {
    try {
      const payload = await request(ENDPOINT);
      const jobsJson = JSON.stringify(payload.jobs);
      if (jobsJson !== jobsJsonRef.current) {
        jobsJsonRef.current = jobsJson;
        setJobs(payload.jobs);
      }
      setError(null);
      return payload.jobs;
    } catch (nextError) {
      setError(nextError.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSaved = useCallback(async () => {
    try {
      const payload = await request(SAVED_ENDPOINT);
      const savedJson = JSON.stringify(payload.collections);
      if (savedJson !== savedJsonRef.current) {
        savedJsonRef.current = savedJson;
        setSavedCollections(payload.collections);
      }
      setError(null);
      return payload.collections;
    } catch (nextError) {
      setError(nextError.message);
      return [];
    }
  }, []);

  const refresh = useCallback(async () => {
    const [nextJobs] = await Promise.all([refreshJobs(), refreshSaved()]);
    return nextJobs;
  }, [refreshJobs, refreshSaved]);

  useEffect(() => {
    let cancelled = false;
    let timeout;

    async function poll() {
      await refreshJobs();
      if (!cancelled) timeout = window.setTimeout(poll, 800);
    }
    poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [refreshJobs]);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const submit = useCallback(
    async (job) => {
      const payload = await request(ENDPOINT, {
        body: JSON.stringify(job),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      await refresh();
      return payload.job;
    },
    [refresh]
  );

  const cancel = useCallback(
    async (id) => {
      await request(`${ENDPOINT}/${id}/cancel`, { method: 'POST' });
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id, outputDirectory) => {
      await request(`${ENDPOINT}/${id}`, {
        body: JSON.stringify({ outputDirectory }),
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      });
      await refresh();
    },
    [refresh]
  );

  const removeAssets = useCallback(
    async (id, outputDirectory, paths) => {
      await request(`${ENDPOINT}/${id}/assets`, {
        body: JSON.stringify({ outputDirectory, paths }),
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      });
      await refresh();
    },
    [refresh]
  );

  const removeSavedAssets = useCallback(
    async (unusedId, outputDirectory, paths) => {
      const payload = await request(`${SAVED_ENDPOINT}/assets`, {
        body: JSON.stringify({ outputDirectory, paths }),
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      });
      const savedJson = JSON.stringify(payload.collections);
      savedJsonRef.current = savedJson;
      setSavedCollections(payload.collections);
      setError(null);
    },
    []
  );

  const keepAsset = useCallback(
    async (id, paths) => {
      try {
        const payload = await request(`${ENDPOINT}/${id}/assets`, {
          body: JSON.stringify({ paths }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });
        await refreshSaved();
        setError(null);
        return payload.assets;
      } catch (nextError) {
        setError(nextError.message);
        return null;
      }
    },
    [refreshSaved]
  );

  const removeMany = useCallback(
    async (collections) => {
      await request(ENDPOINT, {
        body: JSON.stringify({ collections }),
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      });
      await refresh();
    },
    [refresh]
  );

  return {
    cancel,
    error,
    jobs,
    keepAsset,
    loading,
    refresh,
    remove,
    removeAssets,
    removeMany,
    removeSavedAssets,
    savedCollections,
    submit,
  };
}
