import { useCallback, useEffect, useRef } from 'react';

// One build in flight at a time, newest request wins. Control edits otherwise
// queue a 1-2s build each, and a regrow waits behind the whole backlog.
export default function useSpecimenBuilder() {
  const workerRef = useRef(null);
  const stateRef = useRef({ inFlight: null, nextId: 0, queued: null });

  const dispatch = useCallback((job) => {
    const state = stateRef.current;

    state.inFlight = job;
    workerRef.current.postMessage({ id: job.id, params: job.params });
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL('../utils/specimen.worker.js', import.meta.url),
      { type: 'module' }
    );
    const state = stateRef.current;
    const settle = (specimen) => {
      state.inFlight?.resolve(specimen);
      state.inFlight = null;

      if (state.queued) {
        const job = state.queued;

        state.queued = null;
        dispatch(job);
      }
    };

    worker.onmessage = ({ data }) => {
      if (data.id === state.inFlight?.id) {
        settle(data.specimen);
      }
    };
    worker.onerror = (event) => {
      // eslint-disable-next-line no-console
      console.error(`[Flora] specimen worker failed: ${event.message}`);
      settle(null);
    };
    worker.onmessageerror = () => {
      // eslint-disable-next-line no-console
      console.error('[Flora] specimen worker message could not be delivered');
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
    (params) =>
      new Promise((resolve) => {
        const state = stateRef.current;
        const job = { id: state.nextId, params, resolve };

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
