import { Howl } from 'howler';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useSceneAudioStore from '../../../../../../store/useSceneAudioStore';
import { audioFile } from '../../../../../../utils/appUtils';

const FADE_MS = 2000;

// Night meadow audio, following Surrender's Howler + useSceneAudioStore
// pattern: looping wind + cricket-bed ambience gated by the overlay
// toggle, and a frog loop whose volume tracks the ghost's proximity to
// water (sampled from worldgen's shore factor each frame, smoothed).
//
// Frog audio expects `public/audio/frogs-croaking.mp3` — drop
// the converted WAV there; until it exists the Howl load error is
// swallowed and the layer stays silent. (Croak-sprite slicing via the
// audio-sprite script can replace the loop later.)
export default function useNightSounds({
  ambienceVolume = 0.35,
  frogVolume = 0.6,
  tracker,
  windVolume = 0.5,
  world,
}) {
  const registerAudio = useSceneAudioStore((s) => s.registerAudio);
  const unregisterAudio = useSceneAudioStore((s) => s.unregisterAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const frogLevelRef = useRef(0);

  const sounds = useMemo(
    () => ({
      ambience: new Howl({
        src: [audioFile('thunder/night-ambience.mp3')],
        loop: true,
        volume: 0,
        onloaderror: () => {},
      }),
      frogs: new Howl({
        src: [audioFile('frogs-croaking.mp3')],
        loop: true,
        volume: 0,
        onloaderror: () => {},
      }),
      wind: new Howl({
        src: [audioFile('wind-draft-loop.mp3')],
        loop: true,
        volume: 0,
        onloaderror: () => {},
      }),
    }),
    []
  );

  useEffect(() => {
    registerAudio();
    return () => {
      unregisterAudio();
      Object.values(sounds).forEach((sound) => {
        sound.stop();
        sound.unload();
      });
    };
  }, [sounds, registerAudio, unregisterAudio]);

  useEffect(() => {
    if (audioEnabled) {
      sounds.wind.play();
      sounds.wind.fade(0, windVolume, FADE_MS);
      sounds.ambience.play();
      sounds.ambience.fade(0, ambienceVolume, FADE_MS);
      sounds.frogs.play();
      // Frog volume is driven per-frame below; start silent.
      sounds.frogs.volume(0);
    } else {
      sounds.wind.fade(sounds.wind.volume(), 0, FADE_MS);
      sounds.ambience.fade(sounds.ambience.volume(), 0, FADE_MS);
      sounds.frogs.fade(sounds.frogs.volume(), 0, FADE_MS);
      const timeout = setTimeout(() => {
        Object.values(sounds).forEach((sound) => sound.stop());
      }, FADE_MS);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [audioEnabled, sounds, windVolume, ambienceVolume]);

  // Frogs swell as the ghost nears water. sampleShore already encodes
  // "close to/below the water table" as 0..1; smooth it so crossing a
  // shoreline never pops.
  useFrame((_, delta) => {
    if (!audioEnabled || !tracker || !world) return;

    const target = world.sampleShore(tracker.position.x, tracker.position.z);
    const smoothing = 1 - Math.exp(-2 * Math.min(delta, 0.1));
    frogLevelRef.current += (target - frogLevelRef.current) * smoothing;
    sounds.frogs.volume(frogLevelRef.current * frogVolume);
  });
}
