import { Howl } from 'howler';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import useSceneAudioStore from '../../../../../../store/useSceneAudioStore';
import { audioFile } from '../../../../../../utils/appUtils';
import {
  IMPACT_AUDIO_DEFAULTS,
  IMPACT_AUDIO_GROUPS,
} from '../utils/collisionAudioConfig';

function randomInRange([min, max]) {
  return min + Math.random() * (max - min);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createSoundBank() {
  return Object.fromEntries(
    Object.entries(IMPACT_AUDIO_GROUPS).map(([groupKey, groupConfig]) => [
      groupKey,
      {
        config: { ...IMPACT_AUDIO_DEFAULTS, ...groupConfig },
        howls: groupConfig.sources.map(
          (source) =>
            new Howl({
              src: [audioFile(source)],
              pool: 4,
              onloaderror: () => {},
            })
        ),
      },
    ])
  );
}

export default function useCollisionAudio() {
  const registerAudio = useSceneAudioStore((s) => s.registerAudio);
  const unregisterAudio = useSceneAudioStore((s) => s.unregisterAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const audioEnabledRef = useRef(audioEnabled);
  const lastPlaybackRef = useRef(new Map());

  const soundBank = useMemo(() => createSoundBank(), []);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    registerAudio();
    return () => {
      unregisterAudio();
      Object.values(soundBank).forEach((entry) =>
        entry.howls.forEach((howl) => {
          howl.stop();
          howl.unload();
        })
      );
      lastPlaybackRef.current.clear();
    };
  }, [registerAudio, soundBank, unregisterAudio]);

  const playImpact = useCallback(
    (groupKey, impactSpeed = 10) => {
      if (!audioEnabledRef.current) {
        return;
      }
      const entry = soundBank[groupKey];
      if (!entry || impactSpeed < entry.config.minImpactSpeed) {
        return;
      }

      const now = performance.now();
      const lastAt = lastPlaybackRef.current.get(groupKey) ?? 0;
      if (now - lastAt < entry.config.cooldownMs) {
        return;
      }
      lastPlaybackRef.current.set(groupKey, now);

      const howl = pick(entry.howls);
      const id = howl.play();
      howl.volume(randomInRange(entry.config.volumeRange), id);
      howl.rate(randomInRange(entry.config.rateRange), id);
    },
    [soundBank]
  );

  return playImpact;
}
