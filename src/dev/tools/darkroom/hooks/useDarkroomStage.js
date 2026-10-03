import { useCallback, useEffect, useRef, useState } from 'react';

import createStage from '../stage/createStage';
import { engineOf, isAnimated } from '../techniques';

const MAX_DT = 0.1;

// The live preview: re-renders the technique when a new source picture
// lands, an option changes, or the technique animates. A render that is
// still running is never overlapped — a slow kernel just drops frames.
export default function useDarkroomStage({ options, size, source, technique }) {
  const hostRef = useRef(null);
  const instanceRef = useRef(null);
  const latest = useRef({});
  latest.current = { options, size, source, technique };
  const holdRef = useRef(false);
  const [error, setError] = useState(null);
  const [engine, setEngine] = useState('canvas');
  const [renderMs, setRenderMs] = useState(null);
  const [stage, setStage] = useState(null);

  useEffect(() => {
    const next = createStage();
    hostRef.current.appendChild(next.flat);
    setStage(next);
    return () => {
      next.flat.remove();
      next.gpuCanvas?.remove();
      next.dispose();
    };
  }, []);

  useEffect(() => {
    stage?.setSize(size.width, size.height);
  }, [stage, size.height, size.width]);

  useEffect(() => {
    if (!stage) return undefined;
    const instance = technique.create(stage);
    instanceRef.current = instance;
    setError(null);
    return () => {
      instanceRef.current = null;
      instance.dispose();
    };
  }, [stage, technique]);

  useEffect(() => {
    if (!stage) return undefined;
    let frameId = 0;
    let busy = false;
    let reported = 0;
    let last = performance.now();
    let rendered = '';

    const tick = (now) => {
      frameId = requestAnimationFrame(tick);
      const instance = instanceRef.current;
      const { current } = latest;
      if (holdRef.current || busy || !instance || !current.source) return;
      current.source.poll();
      const { frame } = current.source;
      const key = [
        current.technique.id,
        frame.version,
        current.size.width,
        current.size.height,
        JSON.stringify(current.options),
      ].join('|');
      if (key === rendered && !isAnimated(current.technique, current.options)) {
        return;
      }

      const dt = Math.min(MAX_DT, (now - last) / 1000);
      last = now;
      const nextEngine = engineOf(current.technique, current.options);
      stage.setEngine(nextEngine);
      setEngine(nextEngine);
      busy = true;
      const started = performance.now();
      Promise.resolve(
        instance.render({
          dt,
          frame,
          options: current.options,
          size: current.size,
          time: now / 1000,
        })
      )
        .then(() => {
          rendered = key;
          if (now - reported > 500) {
            reported = now;
            setRenderMs(Math.round(performance.now() - started));
          }
          setError(null);
        })
        .catch((failure) => {
          rendered = key;
          // eslint-disable-next-line no-console
          console.error('[darkroom]', failure);
          setError(failure.message);
        })
        .finally(() => {
          busy = false;
          const canvas = stage.gpuCanvas;
          if (canvas && !canvas.parentNode)
            hostRef.current?.appendChild(canvas);
        });
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [stage]);

  // An export drives the instance itself; the preview stands down until it
  // hands control back.
  const hold = useCallback((held) => {
    holdRef.current = held;
  }, []);

  return {
    engine,
    error,
    hold,
    hostRef,
    instanceRef,
    renderMs,
    stage,
  };
}
