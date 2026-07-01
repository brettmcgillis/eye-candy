import { useEffect, useRef } from 'react';

import { quantizeToFreq, resolveScale } from '../utils/musicTheory';

function parseCustomScale(text) {
  if (!text) return null;
  return text
    .split(',')
    .map((part) => parseInt(part.trim(), 10))
    .filter((value) => Number.isFinite(value));
}

function keyOptions(controls) {
  const scale =
    controls.scale === 'custom'
      ? resolveScale('custom', parseCustomScale(controls.customScaleText))
      : resolveScale(controls.scale);
  return {
    root: controls.root,
    scale,
    octaveRange: [controls.octaveLow, controls.octaveHigh],
  };
}

function avg(data, from, to) {
  let sum = 0;
  for (let i = from; i < to; i += 1) sum += data[i];
  return to > from ? sum / (to - from) : 0;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

// Audio, both directions (WS4).
//
// IN  — a mic AnalyserNode → smoothed bass/mid/high bands + a crude beat onset.
//       The conductor maps these onto config deltas (bass throbs gravity, highs
//       sparkle noise, beats kick an impulse). Exposed via `bandsRef`.
// OUT — Tone.js (loaded lazily, so the scene runs fine before `npm i tone`)
//       reads the live sim state from `musicInputsRef` and plays it back through
//       a transport-quantized, in-key voice plus a slow pad. Closes the
//       you-move → particles-react → sound-changes → you-respond instrument loop.
//
// Both directions are gated by controls and degrade to silence cleanly.
export default function useApparitionAudio({ controls, musicInputsRef }) {
  const bandsRef = useRef({ bass: 0, mid: 0, high: 0, beat: 0 });
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const toneRef = useRef(null);

  // ---- AUDIO IN ----
  useEffect(() => {
    if (!controls.audioInEnabled) return undefined;

    let cancelled = false;
    const state = { ctx: null, raf: 0, stream: null, flux: 0 };

    async function boot() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          ctx.close();
          return;
        }
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        state.ctx = ctx;
        state.stream = stream;

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);
          const n = data.length;
          const bass = avg(data, 0, Math.floor(n * 0.08)) / 255;
          const mid =
            avg(data, Math.floor(n * 0.08), Math.floor(n * 0.4)) / 255;
          const high = avg(data, Math.floor(n * 0.4), n) / 255;
          const beat = Math.max(0, bass - state.flux);
          state.flux = state.flux * 0.9 + bass * 0.1;
          const b = bandsRef.current;
          b.bass = bass;
          b.mid = mid;
          b.high = high;
          b.beat = beat;
          state.raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Apparitions audio-in unavailable', error);
      }
    }
    boot();

    return () => {
      cancelled = true;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.stream?.getTracks().forEach((t) => t.stop());
      state.ctx?.close();
      bandsRef.current = { bass: 0, mid: 0, high: 0, beat: 0 };
    };
  }, [controls.audioInEnabled]);

  // ---- AUDIO OUT ----
  useEffect(() => {
    if (!controls.audioOutEnabled) return undefined;

    let cancelled = false;
    let Tone = null;
    let lead = null;
    let pad = null;
    let loop = null;
    let padLoop = null;
    const resume = () => Tone?.start();

    async function boot() {
      try {
        Tone = await import('tone');
      } catch {
        // eslint-disable-next-line no-console
        console.warn('Tone.js not installed — audio-out disabled (npm i tone)');
        return;
      }
      if (cancelled) return;
      toneRef.current = Tone;

      window.addEventListener('pointerdown', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });

      pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 2.5, decay: 1, sustain: 0.6, release: 5 },
      }).toDestination();
      pad.volume.value = -22;

      lead = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 },
      }).toDestination();
      lead.volume.value = -14;

      Tone.getTransport().bpm.value = controlsRef.current.bpm;

      loop = new Tone.Loop((tTime) => {
        const c = controlsRef.current;
        const mi = musicInputsRef.current || {};
        const opts = keyOptions(c);
        const energy = clamp01(mi.bodyEnergy ?? 0);
        // Kinetic energy → note density + velocity.
        if (Math.random() < 0.15 + energy * 0.8) {
          const freq = quantizeToFreq(clamp01(mi.comHeight ?? 0.5), opts);
          const voices = 1 + Math.round(clamp01(mi.density ?? 0) * c.voiceCap);
          for (let v = 0; v < voices; v += 1) {
            lead.triggerAttackRelease(
              freq * (v === 0 ? 1 : 1.5 ** v),
              '16n',
              tTime,
              0.25 + energy * 0.6
            );
          }
        }
      }, controls.subdivision || '8n').start(0);

      // Slow pad drone follows centre-of-mass height, voiced by people present.
      padLoop = new Tone.Loop((tTime) => {
        const c = controlsRef.current;
        const mi = musicInputsRef.current || {};
        const opts = keyOptions(c);
        const root = quantizeToFreq(clamp01(mi.comHeight ?? 0.5) * 0.5, opts);
        pad.releaseAll();
        pad.triggerAttack([root, root * 1.5], tTime, 0.4);
      }, '1m').start(0);

      Tone.getTransport().start();
    }
    boot();

    return () => {
      cancelled = true;
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      loop?.dispose();
      padLoop?.dispose();
      lead?.dispose();
      pad?.dispose();
      try {
        toneRef.current?.getTransport().stop();
      } catch {
        // already torn down
      }
      toneRef.current = null;
    };
  }, [controls.audioOutEnabled]);

  // Live transport tempo updates without rebuilding the graph.
  useEffect(() => {
    const Tone = toneRef.current;
    if (Tone) Tone.getTransport().bpm.rampTo(controls.bpm, 0.1);
  }, [controls.bpm]);

  return { bandsRef };
}
