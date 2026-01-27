/* eslint-disable no-unused-vars */
import * as THREE from 'three';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import useStrudelTrack from '../../../../hooks/useStrudelTrack';
import useCableSubscription from './useCableSubscription';

/* -------------------------------------------------
   useRcaCables — TV brain + A/V bus (with Strudel)
-------------------------------------------------- */

function audioFile(name) {
  return `/audio/${name}`;
}

export default function useRcaCables({
  initialPower = true,
  defaultChannelKey,
  surfChannels = false,
  initialMuted = false,
} = {}) {
  /* ---------- audio core ---------- */

  const ctxRef = useRef(null);
  const tvInput = useRef(null);
  const tvOutput = useRef(null);

  const currentSource = useRef(null);
  const currentGain = useRef(null);

  // 🔑 reactive AudioContext so Strudel waits for it
  const [audioCtx, setAudioCtx] = useState(null);

  /* ---------- tv state ---------- */

  const [unlocked, setUnlocked] = useState(false);
  const [power, setPower] = useState(initialPower);
  const [surfing, setSurfing] = useState(surfChannels);
  const [muted, setMuted] = useState(initialMuted);

  /* ---------- channels ---------- */

  const { channels } = useCableSubscription();

  const channelIndexMap = useMemo(() => {
    const map = {};
    channels.forEach((c, i) => {
      map[c.key] = i;
    });
    return map;
  }, [channels]);

  const [channelIndex, setChannelIndex] = useState(() => {
    if (defaultChannelKey && defaultChannelKey in channelIndexMap) {
      return channelIndexMap[defaultChannelKey];
    }
    return 0;
  });

  const activeChannel = power ? channels[channelIndex] : null;

  /* ---------- audio graph ---------- */

  useEffect(() => {
    console.log('[rca] creating AudioContext…');

    const ctx = new AudioContext();

    const input = ctx.createGain();
    const pre = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const comp = ctx.createDynamicsCompressor();
    const output = ctx.createGain();

    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;

    pre.gain.value = 0.9;
    output.gain.value = initialMuted ? 0.0001 : 0.8;

    input
      .connect(pre)
      .connect(filter)
      .connect(comp)
      .connect(output)
      .connect(ctx.destination);

    ctxRef.current = ctx;
    tvInput.current = input;
    tvOutput.current = output;

    setAudioCtx(ctx);

    console.log('[rca] AudioContext ready', ctx);

    return () => {
      console.log('[rca] closing AudioContext');
      ctx.close();
    };
  }, [initialMuted]);

  /* ---------- Strudel engine (owned by RCA) ---------- */

  // ⚠️ Only instantiate once audioCtx exists
  const strudel = useStrudelTrack(audioCtx ? { audioContext: audioCtx } : null);

  // Patch Strudel into the TV bus once ready
  useEffect(() => {
    if (!strudel?.ready || !strudel.output || !tvInput.current) return;

    console.log('[rca] attempting to patch strudel…');
    console.log('[rca] RCA ctx:', ctxRef.current);
    console.log('[rca] Strudel ctx:', strudel.ctx || strudel.audioContext);

    if (strudel.ctx && ctxRef.current && strudel.ctx !== ctxRef.current) {
      console.error('[rca] ❌ AUDIO CONTEXT MISMATCH — aborting patch');
      return;
    }

    try {
      // Remove default speaker routing
      strudel.output.disconnect();
    } catch (e) {
      console.warn('[rca] strudel output disconnect failed', e);
    }

    // Strudel now becomes a physical TV input
    strudel.output.connect(tvInput.current);

    console.log('[rca] ✅ strudel patched into tv bus');
  }, [strudel?.ready]);

  /* ---------- mute bus ---------- */

  useEffect(() => {
    if (!tvOutput.current || !ctxRef.current) return;

    const ctx = ctxRef.current;
    const target = muted ? 0.0001 : 0.8;

    tvOutput.current.gain.cancelScheduledValues(ctx.currentTime);
    tvOutput.current.gain.linearRampToValueAtTime(
      target,
      ctx.currentTime + 0.15
    );
  }, [muted]);

  /* ---------- mobile unlock ---------- */

  const unlockAudio = async () => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state === 'running') return;

    console.log('[rca] unlocking audio…');
    await ctx.resume();
    await strudel?.unlock?.();
    setUnlocked(true);
    console.log('[rca] audio unlocked');
  };

  /* ---------- fades ---------- */

  function fadeOutAndStop(time = 0.3) {
    if (!currentGain.current || !currentSource.current) return;
    const ctx = ctxRef.current;

    currentGain.current.gain.linearRampToValueAtTime(
      0.0001,
      ctx.currentTime + time
    );

    setTimeout(() => {
      try {
        currentSource.current?.stop?.();
      } catch (e) {
        console.error('[rca cables] current source stop failed', e);
      }
      currentSource.current = null;
      currentGain.current = null;
    }, time * 1000);
  }

  /* ---------- playback (files) ---------- */

  async function playFileChannel(url, loop = true, fade = 0.4) {
    const ctx = ctxRef.current;
    if (!ctx || !tvInput.current) return;

    fadeOutAndStop();
    strudel?.stop?.();

    const res = await fetch(url);
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());

    const src = ctx.createBufferSource();
    const gain = ctx.createGain();

    src.buffer = buf;
    src.loop = loop;

    gain.gain.value = 0.0001;
    src.connect(gain).connect(tvInput.current);
    src.start();

    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + fade);

    currentSource.current = src;
    currentGain.current = gain;
  }

  /* ---------- channel audio router ---------- */

  useEffect(() => {
    if (!power || muted || !activeChannel?.audio) {
      fadeOutAndStop(0.35);
      strudel?.stop?.();
      return;
    }

    const { audio } = activeChannel;

    if (audio.type === 'file') {
      playFileChannel(audio.url, audio.loop);
    }

    if (audio.type === 'strudel' && strudel?.ready) {
      fadeOutAndStop(0.35);
      strudel.play(audio.code);
    }
  }, [power, channelIndex, muted, strudel?.ready]);

  /* ---------- power ---------- */

  const powerOn = () => {
    unlockAudio();
    setPower(true);
  };

  const powerOff = () => {
    fadeOutAndStop(0.35);
    strudel?.stop?.();
    setPower(false);
  };

  const togglePower = () => {
    setPower((p) => {
      if (p) {
        fadeOutAndStop(0.35);
        strudel?.stop?.();
      } else {
        unlockAudio();
      }
      return !p;
    });
  };

  /* ---------- mute controls ---------- */

  const muteOn = () => setMuted(true);
  const muteOff = () => setMuted(false);
  const toggleMute = () => setMuted((m) => !m);

  /* ---------- channels ---------- */

  function nextChannel() {
    setChannelIndex((i) => (i + 1) % channels.length);
  }

  function setChannelByKey(key) {
    if (key in channelIndexMap) setChannelIndex(channelIndexMap[key]);
  }

  /* ---------- surfing ---------- */

  const surfTimer = useRef(0);
  const nextInterval = useRef(1 + Math.random() * 0.5);

  useFrame((_, delta) => {
    if (!power || !surfing) return;

    surfTimer.current += delta;

    if (surfTimer.current >= nextInterval.current) {
      surfTimer.current = 0;
      nextInterval.current = 0.6 + Math.random() * 0.9;
      setChannelIndex((i) => (i + 1) % channels.length);
    }
  });

  const surfOn = () => setSurfing(true);
  const surfOff = () => setSurfing(false);
  const toggleSurfing = () => setSurfing((s) => !s);

  /* ---------- one-shot SFX ---------- */

  async function playOneShot(url, volume = 0.5) {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (ctx.state !== 'running') await unlockAudio();

    const res = await fetch(url);
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());

    const src = ctx.createBufferSource();
    const gain = ctx.createGain();

    gain.gain.value = volume;
    src.buffer = buf;

    // SFX bypass mute bus
    src.connect(gain).connect(ctx.destination);
    src.start();

    src.onended = () => {
      src.disconnect();
      gain.disconnect();
    };
  }

  const knobClick = () => playOneShot(audioFile('knob-click.mp3'), 0.35);
  const dialClick = () => playOneShot(audioFile('switch-click.mp3'), 0.35);

  /* ---------- positional hookup ---------- */

  function attachToObject(object3D) {
    if (!object3D || !tvOutput.current || !ctxRef.current) return;

    const listener = new THREE.AudioListener();
    object3D.add(listener);

    const positional = new THREE.PositionalAudio(listener);
    tvOutput.current.disconnect();
    tvOutput.current.connect(positional.gain);

    positional.setRefDistance(1.2);
    positional.setRolloffFactor(2);

    object3D.add(positional);
  }

  /* ---------- public API ---------- */

  return {
    /* state */
    channels,
    activeChannel,
    channelIndex,
    channelKey: activeChannel?.key ?? null,
    power,
    surfing,
    muted,
    unlocked,

    /* controls */
    powerOn,
    powerOff,
    togglePower,

    muteOn,
    muteOff,
    toggleMute,

    nextChannel,
    setChannelByKey,

    surfOn,
    surfOff,
    toggleSurfing,

    /* audio */
    knobClick,
    dialClick,
    unlockAudio,
    attachToObject,

    // optional: expose strudel for UI / debugging
    strudel,
  };
}
