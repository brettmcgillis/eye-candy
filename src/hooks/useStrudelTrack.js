import { useCallback, useEffect, useRef, useState } from 'react';

import { initStrudel, samples } from '@strudel/web';

export default function useStrudelTrack(options = {}) {
  const { audioContext = undefined, withSamples = true } = options || {};

  const apiRef = useRef(null);
  const ctxRef = useRef(null);
  const ownsCtxRef = useRef(false);
  const outputRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ---------- init ---------- */

  useEffect(() => {
    // RCA not ready yet → wait
    if (audioContext === null) {
      console.log('[strudel] waiting for external AudioContext…');
      return;
    }

    let mounted = true;

    async function init() {
      console.log('[strudel] init start');

      // Decide context source
      let ctx;

      if (audioContext === undefined) {
        ctx = new AudioContext();
        ownsCtxRef.current = true;
        console.log('[strudel] created internal AudioContext');
      } else {
        ctx = audioContext;
        ownsCtxRef.current = false;
        console.log('[strudel] using external AudioContext');
      }

      ctxRef.current = ctx;

      const api = await initStrudel({
        audioContext: ctx,
        prebake: withSamples
          ? () => samples('github:tidalcycles/dirt-samples')
          : undefined,
      });

      if (!mounted) return;

      apiRef.current = api;

      // 🔊 master output node (same context, always safe)
      const out = ctx.createGain();
      out.gain.value = 1;

      // default standalone route → speakers
      if (ownsCtxRef.current) {
        out.connect(ctx.destination);
      }

      // patch strudel → out
      if (api.connect) {
        api.connect(out);
      } else if (api.masterGain?.connect) {
        api.masterGain.connect(out);
      } else {
        console.warn('[strudel] could not find strudel output to connect');
      }

      outputRef.current = out;

      setReady(true);

      console.log('[strudel] init done');
      console.log('[strudel] ctx ===', ctx);
      console.log('[strudel] output ===', out);
    }

    init();

    // eslint-disable-next-line consistent-return
    return () => {
      mounted = false;

      try {
        apiRef.current?.evaluate?.('hush');
      } catch (e) {
        console.error('[strudel] hush failed');
      }

      try {
        outputRef.current?.disconnect();
      } catch (e) {
        console.error('[strudel] disconnect failed');
      }

      if (ownsCtxRef.current && ctxRef.current) {
        try {
          ctxRef.current.close();
        } catch (e) {
          console.error('[strudel] ctx close failed');
        }
      }

      apiRef.current = null;
      outputRef.current = null;
      ctxRef.current = null;
      ownsCtxRef.current = false;

      setReady(false);
      setIsPlaying(false);
    };
  }, [audioContext, withSamples]);

  /* ---------- unlock ---------- */

  const unlock = useCallback(async () => {
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== 'running') {
      console.log('[strudel] unlocking audio…');
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

  /* ---------- public ---------- */

  return {
    ready,
    isPlaying,
    play,
    stop,
    unlock,

    // 🔌 RCA patch point
    output: outputRef.current,

    // 🧠 diagnostics
    ctx: ctxRef.current,
  };
}
