import { Howl } from 'howler';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useSceneAudioStore from '../../../../../../store/useSceneAudioStore';
import { audioFile } from '../../../../../../utils/appUtils';
import useStormSounds from './useStormSounds';

// Multi-frequency sine noise — convincing flicker without an external noise library.
// Layering three incommensurable frequencies produces an irregular, non-repeating pattern.
function flickerNoise(t) {
  return (
    0.45 * Math.sin(t * 7.3 + 1.7) +
    0.3 * Math.sin(t * 19.1 + 3.1) +
    0.25 * Math.sin(t * 43.7 + 0.9)
  );
}

const BASE_FLASH_COLOR = new THREE.Color('#5a5870');

function ThunderLightningInner({
  bgBaseColor,
  position = [5, 8, -4],
  lightColor = '#c8c4ff',
  peakIntensity = 18,
  firstStrikeDelay = 9,
  minGap = 12,
  maxGap = 28,
}) {
  const { scene } = useThree();
  const lightRef = useRef();

  useStormSounds();

  const baseColor = useRef(new THREE.Color(bgBaseColor));
  const lerpedBg = useRef(new THREE.Color(bgBaseColor));
  useEffect(() => {
    baseColor.current.set(bgBaseColor);
  }, [bgBaseColor]);

  const state = useRef({
    phase: 'waiting',
    nextStrikeAt: firstStrikeDelay + Math.random() * 4,
    strikeEnd: 0,
    strikeDuration: 0,
  });

  // Single file with three sprites — same source as demo-2024-a-storm-at-midnight.
  // Howler handles missing files gracefully; the visual effect works without audio.
  const sound = useMemo(
    () =>
      new Howl({
        src: [audioFile('thunder/thunderstorm.mp3')],
        volume: 0.75,
        sprite: {
          thunder1: [4000, 16000],
          thunder2: [18000, 28000],
          thunder3: [28000, 33000],
        },
        onloaderror: () => {},
      }),
    []
  );

  const SPRITES = ['thunder1', 'thunder2', 'thunder3'];

  useEffect(() => () => sound.unload(), [sound]);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.elapsedTime;
    const s = state.current;

    if (s.phase === 'waiting') {
      if (t >= s.nextStrikeAt) {
        const duration = 0.5 + Math.random() * 0.9;
        s.phase = 'flickering';
        s.strikeEnd = t + duration;
        s.strikeDuration = duration;
        if (useSceneAudioStore.getState().audioEnabled) {
          sound.play(SPRITES[Math.floor(Math.random() * SPRITES.length)]);
        }
      }
    }

    if (s.phase === 'flickering') {
      if (t >= s.strikeEnd) {
        lightRef.current.intensity = 0;
        lerpedBg.current.copy(baseColor.current);
        if (scene.background) scene.background.copy(baseColor.current);
        s.phase = 'waiting';
        s.nextStrikeAt = t + minGap + Math.random() * (maxGap - minGap);
        return;
      }

      const progress = 1 - (s.strikeEnd - t) / s.strikeDuration;
      // Power curve: fast sharp peak at start, long rumbling tail
      const envelope = (1 - progress) ** 1.8;
      // Clamp noise to [0,1] range for a clean intensity multiplier
      const noise = (flickerNoise(t * 10) + 1) * 0.5;

      lightRef.current.intensity = envelope * noise * peakIntensity;

      // Pulse the sky — lerp background toward a lighter stormy blue-grey
      lerpedBg.current.lerpColors(
        baseColor.current,
        BASE_FLASH_COLOR,
        envelope * noise * 0.7
      );
      if (scene.background) scene.background.copy(lerpedBg.current);
    } else {
      lightRef.current.intensity = 0;
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      position={position}
      color={lightColor}
      intensity={0}
      castShadow={false}
    />
  );
}

function ThunderLightning(props) {
  return <ThunderLightningInner {...props} />;
}

export default memo(ThunderLightning);
