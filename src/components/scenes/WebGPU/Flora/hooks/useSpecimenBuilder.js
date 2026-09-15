import { useCallback, useEffect, useRef } from 'react';

export default function useSpecimenBuilder() {
  const workerRef = useRef(null);
  const pendingRef = useRef(new Map());
  const nextIdRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL('../utils/specimen.worker.js', import.meta.url),
      {
        type: 'module',
      }
    );
    const pending = pendingRef.current;

    worker.onmessage = ({ data }) => {
      pending.get(data.id)?.(data.specimen);
      pending.delete(data.id);
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
      pending.clear();
      workerRef.current = null;
    };
  }, []);

  return useCallback(
    (params) =>
      new Promise((resolve) => {
        const id = nextIdRef.current;

        nextIdRef.current += 1;
        pendingRef.current.set(id, resolve);
        workerRef.current?.postMessage({ id, params });
      }),
    []
  );
}
