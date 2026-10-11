import { useCallback, useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 350;

// Rebuilds the print in a worker whenever the options settle; only the most
// recent request's answer is kept, so dragging a field never shows a stale
// model after a fresh one.
export default function usePrintBuild(printable, options) {
  const workerRef = useRef(null);
  const pending = useRef(new Map());
  const nextId = useRef(0);
  const latestBuild = useRef(0);
  const [state, setState] = useState({
    building: false,
    error: null,
    bodies: null,
    report: null,
  });

  useEffect(() => {
    const worker = new Worker(
      new URL('../printShop.worker.js', import.meta.url),
      {
        type: 'module',
      }
    );
    worker.onmessage = ({ data }) => {
      const waiter = pending.current.get(data.id);
      pending.current.delete(data.id);
      if (data.type === 'error') waiter?.reject(new Error(data.message));
      else waiter?.resolve(data);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const send = useCallback((message, transfer) => {
    nextId.current += 1;
    const id = nextId.current;
    return new Promise((resolve, reject) => {
      pending.current.set(id, { reject, resolve });
      workerRef.current.postMessage({ ...message, id }, transfer);
    });
  }, []);

  const key = JSON.stringify({ options, printable });
  useEffect(() => {
    if (!options) return undefined;
    const timer = setTimeout(async () => {
      const build = latestBuild.current + 1;
      latestBuild.current = build;
      setState((current) => ({ ...current, building: true, error: null }));
      try {
        const result = await send({ options, printable });
        if (build !== latestBuild.current) return;
        setState({
          building: false,
          error: null,
          bodies: result.bodies,
          report: result.report,
        });
      } catch (error) {
        if (build !== latestBuild.current) return;
        setState((current) => ({
          ...current,
          building: false,
          error: error.message,
        }));
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key, send]);

  return state;
}
