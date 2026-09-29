import { useCallback, useEffect, useRef } from 'react';

// Plans a panel's leaves off the main thread, one build in flight and only
// the newest request queued behind it, so a slider drag or a webcam stream
// never builds a backlog.
export default function useLeavesBuilder() {
  const workerRef = useRef(null);
  const stateRef = useRef({ inFlight: null, nextId: 0, queued: null });

  const dispatch = useCallback((job) => {
    stateRef.current.inFlight = job;
    workerRef.current.postMessage({
      config: job.config,
      id: job.id,
      image: job.image,
    });
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    const worker = new Worker(
      new URL('../utils/leaves.worker.js', import.meta.url),
      { type: 'module' }
    );
    const settle = (result) => {
      state.inFlight?.resolve(result);
      state.inFlight = null;
      if (state.queued) {
        const job = state.queued;
        state.queued = null;
        dispatch(job);
      }
    };
    worker.onmessage = ({ data }) => {
      if (data.id === state.inFlight?.id) settle(data.result);
    };
    worker.onerror = (event) => {
      // eslint-disable-next-line no-console
      console.error(`[Kumiko] leaves worker failed: ${event.message}`);
      settle(null);
    };
    workerRef.current = worker;
    if (state.queued) {
      const job = state.queued;
      state.queued = null;
      dispatch(job);
    }
    return () => {
      worker.terminate();
      state.inFlight?.resolve(null);
      state.queued?.resolve(null);
      state.inFlight = null;
      state.queued = null;
      workerRef.current = null;
    };
  }, [dispatch]);

  return useCallback(
    (config, image) =>
      new Promise((resolve) => {
        const state = stateRef.current;
        const job = { config, id: state.nextId, image, resolve };
        state.nextId += 1;
        if (state.inFlight || !workerRef.current) {
          state.queued?.resolve(null);
          state.queued = job;
        } else {
          dispatch(job);
        }
      }),
    [dispatch]
  );
}
