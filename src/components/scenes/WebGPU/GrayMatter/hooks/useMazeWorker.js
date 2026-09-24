import { useEffect, useRef, useState } from 'react';

// Owns the maze worker: builds the fine tracing surface once per skull, and
// traces each settled field into tubes off the main thread. Replies from a
// superseded surface are dropped by id.
export default function useMazeWorker({ maxEdge, surface }) {
  const [positions, setPositions] = useState(null);
  const workerRef = useRef(null);
  const pendingRef = useRef(new Map());
  const epochRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL('../utils/maze.worker.js', import.meta.url),
      {
        type: 'module',
      }
    );
    epochRef.current += 1;
    const epoch = epochRef.current;
    setPositions(null);

    worker.onmessage = ({ data }) => {
      if (data.type === 'surface') {
        if (data.id === epoch) setPositions(data.positions);
        return;
      }
      const resolve = pendingRef.current.get(data.id);
      pendingRef.current.delete(data.id);
      resolve?.(data.tubes);
    };
    worker.onerror = (event) => {
      // eslint-disable-next-line no-console
      console.error(`[GrayMatter] maze worker failed: ${event.message}`);
    };
    worker.postMessage({
      id: epoch,
      maxEdge,
      surface: {
        graph: {
          count: surface.graph.count,
          positions: surface.graph.positions,
          triangles: surface.graph.triangles,
        },
        outer: surface.outer,
        reach: surface.reach,
      },
      type: 'surface',
    });
    workerRef.current = worker;

    const pending = pendingRef.current;
    return () => {
      worker.terminate();
      pending.forEach((resolve) => resolve(null));
      pending.clear();
      workerRef.current = null;
    };
  }, [maxEdge, surface]);

  const trace = (strength, options) =>
    new Promise((resolve) => {
      const id = `${epochRef.current}:${Math.random()}`;
      pendingRef.current.set(id, resolve);
      workerRef.current.postMessage({ id, options, strength, type: 'trace' }, [
        strength.buffer,
      ]);
    });

  return { positions, trace };
}
