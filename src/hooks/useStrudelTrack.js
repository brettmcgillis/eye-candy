import { useCallback, useEffect, useRef, useState } from 'react';

import { initStrudel, samples } from '@strudel/web';

export default function useStrudelTrack({ withSamples = true } = {}) {
  const apiRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ---------- init ---------- */

  useEffect(() => {
    let mounted = true;

    async function init() {
      console.log('[strudel] init start');

      const api = await initStrudel({
        prebake: withSamples
          ? () => samples('github:tidalcycles/dirt-samples')
          : undefined,
      });

      if (!mounted) return;

      apiRef.current = api;
      setReady(true);

      console.log('[strudel] init done', api);
    }

    init();

    return () => {
      mounted = false;
      try {
        apiRef.current?.evaluate?.('hush');
      } catch (e) {
        console.warn('[strudel] unmount hush failed', e);
      }
      apiRef.current = null;
      setReady(false);
      setIsPlaying(false);
    };
  }, [withSamples]);

  /* ---------- mobile unlock ---------- */

  const unlock = useCallback(async () => {
    const ctx =
      apiRef.current?.audioContext ||
      apiRef.current?.ctx ||
      apiRef.current?.getAudioContext?.();

    if (ctx && ctx.state !== 'running') {
      console.log('[strudel] unlocking audio...');
      await ctx.resume();
      console.log('[strudel] audio state:', ctx.state);
    }
  }, []);

  /* ---------- stop ---------- */

  const stop = useCallback(() => {
    if (!apiRef.current?.evaluate) return;

    try {
      apiRef.current.evaluate('hush');
      setIsPlaying(false);
      console.log('[strudel] stop');
    } catch (e) {
      console.error('[strudel] stop failed:', e);
    }
  }, []);

  /* ---------- play ---------- */

  const play = useCallback(
    async (code) => {
      if (!apiRef.current?.evaluate) return;

      await unlock();

      try {
        apiRef.current.evaluate('hush');
        apiRef.current.evaluate(code);
        setIsPlaying(true);
        console.log('[strudel] play');
      } catch (e) {
        setIsPlaying(false);
        console.error('[strudel] play failed:', e);
      }
    },
    [unlock]
  );

  return {
    ready,
    isPlaying,
    play,
    stop,
  };
}
