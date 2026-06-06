import { useCallback, useEffect, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

const FFT_SIZE = 2048;
const SMOOTHING = 0.8;
// Fixed size covers the max leva band count. BandedHorse reads bandsRef[i]
// for i in [0, bandCount), so this must be >= the leva max (64).
const MAX_BANDS = 64;

// Maps FFT bins into MAX_BANDS logarithmically-spaced bands (fixed at init)
function buildBandRanges(binCount, sampleRate) {
  const nyquist = sampleRate / 2;
  const minFreq = 20;
  const maxFreq = Math.min(nyquist, 16000);
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);

  return Array.from({ length: MAX_BANDS }, (_, i) => {
    const loFreq = 10 ** (logMin + (i / MAX_BANDS) * (logMax - logMin));
    const hiFreq = 10 ** (logMin + ((i + 1) / MAX_BANDS) * (logMax - logMin));
    const loBin = Math.max(0, Math.floor((loFreq / nyquist) * binCount));
    const hiBin = Math.min(
      binCount - 1,
      Math.ceil((hiFreq / nyquist) * binCount)
    );
    return [loBin, hiBin];
  });
}

export default function useAudioAnalyzer() {
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const bandRangesRef = useRef(null);
  const streamRef = useRef(null);
  const audioElRef = useRef(null);
  const bandsRef = useRef(new Float32Array(MAX_BANDS));
  const [sourceMode, setSourceMode] = useState(null);
  const [error, setError] = useState(null);

  // Web Audio uses a pull model — nodes only process if they're connected
  // (directly or transitively) to a destination. We always wire:
  //   analyser → MediaStreamDestinationNode  (a "dummy" dest, no speakers)
  // This keeps the analyser processing for every source type.
  // For file/default we additionally wire the source to ctx.destination so
  // the user can hear it. For mic/system we don't, to prevent echo.
  function ensureContext() {
    if (ctxRef.current) return ctxRef.current;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;
    analyser.connect(ctx.createMediaStreamDestination()); // keep-alive, silent
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    bandRangesRef.current = buildBandRanges(
      analyser.frequencyBinCount,
      ctx.sampleRate
    );
    return ctx;
  }

  function disconnectSource() {
    // Only disconnect the source — never touch the analyser's keep-alive wiring
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioElRef.current?.pause();
    audioElRef.current = null;
  }

  async function resumeContext(ctx) {
    if (ctx.state === 'suspended') await ctx.resume();
  }

  // Connect an HTMLAudioElement (file playback)
  const connectFile = useCallback((file) => {
    setError(null);
    disconnectSource();
    const ctx = ensureContext();

    const el = new Audio();
    el.src = URL.createObjectURL(file);
    el.loop = true;
    el.crossOrigin = 'anonymous';
    audioElRef.current = el;

    const src = ctx.createMediaElementSource(el);
    src.connect(analyserRef.current); // analysis
    src.connect(ctx.destination); // audible playback
    sourceRef.current = src;
    setSourceMode('file');
    resumeContext(ctx).then(() => el.play().catch(() => {}));
  }, []);

  // Capture tab/system audio via getDisplayMedia.
  // video: true is required to trigger Chrome's share dialog — audio-only
  // requests are silently dropped in most Chrome versions. Video tracks are
  // stopped immediately after the stream is granted; only audio is used.
  const connectSystem = useCallback(async () => {
    setError(null);
    disconnectSource();
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });
      stream.getVideoTracks().forEach((t) => t.stop());
      if (!stream.getAudioTracks().length) {
        setError(
          'No audio captured. Pick a Chrome Tab and allow audio sharing.'
        );
        return;
      }
      streamRef.current = stream;
      const ctx = ensureContext();
      await resumeContext(ctx);
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyserRef.current); // analysis only — no ctx.destination to avoid echo
      sourceRef.current = src;
      setSourceMode('system');
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'Permission denied.' : e.message);
    }
  }, []);

  // Connect microphone
  const connectMic = useCallback(async () => {
    setError(null);
    disconnectSource();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = ensureContext();
      await resumeContext(ctx);
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyserRef.current); // analysis only — no ctx.destination to avoid echo
      sourceRef.current = src;
      setSourceMode('mic');
    } catch (e) {
      setError(
        e.name === 'NotAllowedError' ? 'Mic permission denied.' : e.message
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      disconnectSource();
      ctxRef.current?.close();
    },
    []
  );

  // Update band energies from analyser data every frame
  useFrame(({ clock }) => {
    const bands = bandsRef.current;

    if (
      !analyserRef.current ||
      !dataArrayRef.current ||
      !bandRangesRef.current
    ) {
      // Simulated fallback while no audio source is connected
      const t = clock.elapsedTime;
      for (let i = 0; i < MAX_BANDS; i += 1) {
        const slow = Math.sin(t * (0.4 + i * 0.07) + i * 1.3) * 0.5 + 0.5;
        const fast = Math.sin(t * (2.1 + i * 0.19) + i * 0.7) * 0.3 + 0.3;
        const pulse = Math.max(0, Math.sin(t * 3.5 + i * 0.5)) * 0.2;
        bands[i] = Math.min(1, slow * 0.5 + fast * 0.35 + pulse);
      }
      return;
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const data = dataArrayRef.current;
    const ranges = bandRangesRef.current;

    for (let i = 0; i < MAX_BANDS; i += 1) {
      const [lo, hi] = ranges[i];
      let sum = 0;
      const count = Math.max(1, hi - lo + 1);
      for (let b = lo; b <= hi; b += 1) sum += data[b];
      bands[i] = sum / count / 255;
    }
  });

  const disconnect = useCallback(() => {
    disconnectSource();
    setSourceMode(null);
  }, []);

  return {
    bandsRef,
    sourceMode,
    error,
    connectFile,
    connectMic,
    connectSystem,
    disconnect,
  };
}
