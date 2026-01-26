/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import CRTBlueScreenMaterial, {
  TerminalSetting,
  VHSSetting,
} from 'components/scenes/CRTTest/CRTBlueScreenMaterial';
import CRTSceneInSceneMaterial from 'components/scenes/CRTTest/CRTSceneInSceneMaterial';
import CRTSceneMaterial from 'components/scenes/CRTTest/CRTSceneMaterial';
import CRTShowMaterial from 'components/scenes/CRTTest/CRTShowMaterial';
import CRTSnowMaterial from 'components/scenes/CRTTest/CRTSnowMaterial';
import CRTStaticMaterial from 'components/scenes/CRTTest/CRTStaticMaterial';
import TestScene from 'components/scenes/CRTTest/TestScene';

/* -------------------------------------------------
   useRcaCables — centralized TV A/V bus
-------------------------------------------------- */

export default function useRcaCables() {
  const ctxRef = useRef(null);
  const currentSource = useRef(null);
  const currentGain = useRef(null);

  const tvInput = useRef(null);
  const tvOutput = useRef(null);

  const [unlocked, setUnlocked] = useState(false);

  /* ---------- audio context + TV speaker chain ---------- */

  useEffect(() => {
    const ctx = new AudioContext();

    const input = ctx.createGain();
    const preGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const comp = ctx.createDynamicsCompressor();
    const output = ctx.createGain();

    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;

    preGain.gain.value = 0.9;
    output.gain.value = 0.8;

    input
      .connect(preGain)
      .connect(filter)
      .connect(comp)
      .connect(output)
      .connect(ctx.destination);

    ctxRef.current = ctx;
    tvInput.current = input;
    tvOutput.current = output;

    return () => {
      ctx.close();
    };
  }, []);

  /* ---------- mobile unlock ---------- */

  const unlockAudio = async () => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state === 'running') return;
    await ctx.resume();
    setUnlocked(true);
  };

  /* ---------- one-shot SFX ---------- */

  async function playOneShot(url, volume = 0.6) {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const res = await fetch(url);
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());

    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;

    src.buffer = buf;
    src.connect(gain).connect(tvInput.current);
    src.start();
  }

  const knobClick = () => {
    // playOneShot('/audio/knob-click.wav', 0.35);
  };
  const dialClick = () => {
    // playOneShot('/audio/dial-click.wav', 0.5);
  };

  /* ---------- fades ---------- */

  function fadeOutAndStop(time = 0.25) {
    if (!currentGain.current || !currentSource.current) return;
    const ctx = ctxRef.current;

    currentGain.current.gain.linearRampToValueAtTime(
      0.0001,
      ctx.currentTime + time
    );

    setTimeout(() => {
      currentSource.current?.stop();
      currentSource.current = null;
      currentGain.current = null;
    }, time * 1000);
  }

  /* ---------- channel playback ---------- */

  async function playFileChannel(url, loop = true, fade = 0.4) {
    const ctx = ctxRef.current;
    if (!ctx) return;

    fadeOutAndStop();

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

  /* ---------- power ---------- */

  const powerOff = () => fadeOutAndStop(0.35);
  const powerOn = () => unlockAudio();

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

  /* ---------- CHANNEL BUS (A/V together) ---------- */

  const channels = useMemo(
    () => [
      {
        key: 'snow',
        video: <CRTSnowMaterial />,
        // audio: { type: 'file', url: '/audio/tv-static.mp3', loop: true },
      },

      {
        key: 'static',
        video: <CRTStaticMaterial />,
        // audio: { type: 'file', url: '/audio/tv-noise-low.mp3', loop: true },
      },

      {
        key: 'vhs',
        video: (
          <CRTBlueScreenMaterial
            {...VHSSetting}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        // audio: { type: 'file', url: '/audio/vhs-hum.mp3', loop: true },
      },

      {
        key: 'terminal',
        video: (
          <CRTBlueScreenMaterial
            {...TerminalSetting}
            horizontalPadding={100}
            verticalPadding={95}
          />
        ),
        // audio: { type: 'file', url: '/audio/modem-drone.mp3', loop: true },
      },

      {
        key: 'homeVideo',
        video: <CRTShowMaterial useWebcam />,
        // audio: { type: 'file', url: '/audio/room-tone.mp3', loop: true },
      },

      {
        key: 'tv',
        video: <CRTShowMaterial />,
        // audio: { type: 'file', url: '/audio/show.mp3', loop: true },
      },

      {
        key: 'threeD',
        video: <CRTSceneMaterial scene={<TestScene />} />,
        // audio: { type: 'file', url: '/audio/synth-bed.mp3', loop: true },
      },

      {
        key: 'pip',
        video: <CRTSceneInSceneMaterial />,
        // audio: { type: 'file', url: '/audio/camera-feed.mp3', loop: true },
      },
    ],
    []
  );

  /* ---------- channel switching ---------- */

  function tuneChannel(i) {
    const ch = channels[i % channels.length];
    if (!ch?.audio) return;

    if (ch.audio.type === 'file') {
      playFileChannel(ch.audio.url, ch.audio.loop);
    }

    // reserved:
    // if (ch.audio.type === 'strudel') playStrudelChannel(ch.audio)
  }

  return {
    channels,

    tuneChannel,
    powerOn,
    powerOff,

    knobClick,
    dialClick,

    attachToObject,
    unlockAudio,
    unlocked,
  };
}
