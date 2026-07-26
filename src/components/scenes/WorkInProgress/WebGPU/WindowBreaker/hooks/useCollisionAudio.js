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
    Object.entries(IMPACT_AUDIO_GROUPS).map(([groupKey, groupConfig]) => {
      const config = { ...IMPACT_AUDIO_DEFAULTS, ...groupConfig };

      if (groupConfig.sprites) {
        return [
          groupKey,
          {
            type: 'sprite',
            config,
            howl: new Howl({
              src: [audioFile(groupConfig.source)],
              sprite: groupConfig.sprites,
              pool: 4,
              onloaderror: () => {},
            }),
          },
        ];
      }

      return [
        groupKey,
        {
          type: 'variant',
          config,
          howls: groupConfig.sources.map(
            (source) =>
              new Howl({
                src: [audioFile(source)],
                pool: 4,
                onloaderror: () => {},
              })
          ),
        },
      ];
    })
  );
}

function unloadSoundBank(soundBank) {
  Object.values(soundBank).forEach((entry) => {
    if (entry.type === 'sprite') {
      entry.howl.stop();
      entry.howl.unload();
      return;
    }

    entry.howls.forEach((howl) => {
      howl.stop();
      howl.unload();
    });
  });
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
      unloadSoundBank(soundBank);
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

      const volume = randomInRange(entry.config.volumeRange);
      const rate = randomInRange(entry.config.rateRange);

      if (entry.type === 'sprite') {
        const clipKey = pick(entry.config.clipKeys);
        const id = entry.howl.play(clipKey);
        entry.howl.volume(volume, id);
        entry.howl.rate(rate, id);
        return;
      }

      const howl = pick(entry.howls);
      const id = howl.play();
      howl.volume(volume, id);
      howl.rate(rate, id);
    },
    [soundBank]
  );

  return playImpact;
}
