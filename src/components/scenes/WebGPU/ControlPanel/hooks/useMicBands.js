import { useEffect, useRef } from 'react';

import { BANDS } from '@modules/controlPanel';

const FFT_SIZE = 1024;
const MIN_HZ = 40;
const MAX_HZ = 12000;

function bandRanges(binCount, sampleRate) {
  const nyquist = sampleRate / 2;
  const lo = Math.log10(MIN_HZ);
  const hi = Math.log10(Math.min(MAX_HZ, nyquist));
  return Array.from({ length: BANDS }, (_, i) => {
    const from = 10 ** (lo + ((hi - lo) * i) / BANDS);
    const to = 10 ** (lo + ((hi - lo) * (i + 1)) / BANDS);
    return [
      Math.floor((from / nyquist) * binCount),
      Math.max(Math.ceil((to / nyquist) * binCount), 1),
    ];
  });
}

// Microphone levels in the kernel's BANDS log bands, each in [0, 1]:
// `read()` returns them (null until the mic is live, so the panel falls
// back to its procedural track).
export default function useMicBands(enabled, gain) {
  const live = useRef(null);
  const gainRef = useRef(gain);
  gainRef.current = gain;

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let context = null;
    let stream = null;
    (async () => {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.6;
      context.createMediaStreamSource(stream).connect(analyser);
      live.current = {
        analyser,
        bands: new Float32Array(BANDS),
        bins: new Uint8Array(analyser.frequencyBinCount),
        ranges: bandRanges(analyser.frequencyBinCount, context.sampleRate),
      };
    })().catch(() => {
      live.current = null;
    });
    return () => {
      cancelled = true;
      live.current = null;
      stream?.getTracks().forEach((track) => track.stop());
      context?.close();
    };
  }, [enabled]);

  return {
    read() {
      const mic = live.current;
      if (!mic) return null;
      mic.analyser.getByteFrequencyData(mic.bins);
      mic.ranges.forEach(([from, to], i) => {
        let peak = 0;
        for (let b = from; b < to; b += 1) peak = Math.max(peak, mic.bins[b]);
        mic.bands[i] = Math.min((peak / 255) * gainRef.current, 1);
      });
      return mic.bands;
    },
  };
}
