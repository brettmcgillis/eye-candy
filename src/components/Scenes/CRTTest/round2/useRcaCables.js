/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useFrame } from '@react-three/fiber';

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
   useRcaCables — TV brain + A/V bus (with mute)
-------------------------------------------------- */

function audioFile(name) {
  return `${process.env.PUBLIC_URL}/audio/${name}`;
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

  /* ---------- tv state ---------- */

  const [unlocked, setUnlocked] = useState(false);
  const [power, setPower] = useState(initialPower);
  const [surfing, setSurfing] = useState(surfChannels);
  const [muted, setMuted] = useState(initialMuted);

  /* ---------- channels ---------- */

  const channels = useMemo(
    () => [
      {
        key: 'snow',
        video: <CRTSnowMaterial />,
        audio: null, // Static
      },
      {
        key: 'static',
        video: <CRTStaticMaterial />,
        audio: null, // Different static
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
        audio: null, // Vhs Rewind
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
        audio: null, // Terminal boop?
      },
      {
        key: 'homeVideo',
        video: <CRTShowMaterial useWebcam />,
        audio: null, // Laugh track
      },
      {
        key: 'tv',
        video: <CRTShowMaterial />,
        audio: {
          type: 'file',
          url: audioFile('ren-and-stimpy.mp3'),
          loop: true,
        },
      },
      {
        key: 'threeD',
        video: <CRTSceneMaterial scene={<TestScene />} />,
        audio: null, // Strudel something?
      },
      { key: 'pip', video: <CRTSceneInSceneMaterial />, audio: null },
    ],
    []
  );

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

    return () => ctx.close();
  }, []);

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
    await ctx.resume();
    setUnlocked(true);
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
      currentSource.current?.stop();
      currentSource.current = null;
      currentGain.current = null;
    }, time * 1000);
  }

  /* ---------- playback ---------- */

  async function playFileChannel(url, loop = true, fade = 0.4) {
    const ctx = ctxRef.current;
    if (!ctx || !tvInput.current) return;

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

  /* ---------- channel audio router ---------- */

  useEffect(() => {
    if (!power || muted || !activeChannel?.audio) {
      fadeOutAndStop(0.35);
      return;
    }

    const { audio } = activeChannel;

    if (audio.type === 'file') {
      playFileChannel(audio.url, audio.loop);
    }
  }, [power, channelIndex, muted]);

  /* ---------- power ---------- */

  const powerOn = () => {
    unlockAudio();
    setPower(true);
  };

  const powerOff = () => {
    fadeOutAndStop(0.35);
    setPower(false);
  };

  const togglePower = () => {
    setPower((p) => {
      if (p) fadeOutAndStop(0.35);
      else unlockAudio();
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

    // SFX bypass mute bus (feels physical)
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
  };
}
