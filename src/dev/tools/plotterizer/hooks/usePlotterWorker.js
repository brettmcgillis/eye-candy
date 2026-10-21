import { useCallback, useEffect, useRef } from 'react';

export default function usePlotterWorker() {
  const workerRef = useRef(null);
  const pending = useRef(new Map());
  const nextId = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL('../plotterizer.worker.js', import.meta.url),
      { type: 'module' }
    );
    const waiting = pending.current;
    worker.onmessage = ({ data }) => {
      const waiter = waiting.get(data.id);
      waiting.delete(data.id);
      if (data.type === 'error') waiter?.reject(new Error(data.message));
      else waiter?.resolve(data);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      waiting.forEach(({ reject }) => reject(new Error('Worker closed.')));
      waiting.clear();
    };
  }, []);

  return useCallback((message) => {
    nextId.current += 1;
    const id = nextId.current;
    return new Promise((resolve, reject) => {
      pending.current.set(id, { reject, resolve });
      workerRef.current.postMessage({ ...message, id });
    });
  }, []);
}
