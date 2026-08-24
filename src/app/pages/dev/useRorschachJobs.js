import { useCallback, useEffect, useRef, useState } from 'react';

const ENDPOINT = '/dev-api/rorschach/jobs';

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
  const jobsJsonRef = useRef('');

  const refresh = useCallback(async () => {
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

  useEffect(() => {
    let cancelled = false;
    let timeout;

    async function poll() {
      await refresh();
      if (!cancelled) timeout = window.setTimeout(poll, 800);
    }
    poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [refresh]);

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
    loading,
    refresh,
    remove,
    removeAssets,
    removeMany,
    submit,
  };
}
