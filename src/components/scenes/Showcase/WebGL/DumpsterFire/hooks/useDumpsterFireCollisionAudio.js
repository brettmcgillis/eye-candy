import { Howl } from 'howler';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import useSceneAudioStore from '../../../../../../store/useSceneAudioStore';
import { audioFile } from '../../../../../../utils/appUtils';
import {
  DUMPSTER_FIRE_COLLISION_AUDIO_DEFAULTS,
  DUMPSTER_FIRE_COLLISION_AUDIO_GROUPS,
  getTrashCollisionAudioGroupKey,
} from '../utils/collisionAudioConfig';

function randomInRange([min, max]) {
  return min + Math.random() * (max - min);
}

function pickRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function midpoint([min, max]) {
  return min + (max - min) / 2;
}

function getImpactSpeed(body) {
  const linearVelocity = body?.linvel?.();

  if (!linearVelocity) {
    return 0;
  }

  return Math.hypot(linearVelocity.x, linearVelocity.y, linearVelocity.z);
}

function createSoundBank() {
  return Object.fromEntries(
    Object.entries(DUMPSTER_FIRE_COLLISION_AUDIO_GROUPS).map(
      ([groupKey, groupConfig]) => {
        if (groupConfig.sprites) {
          return [
            groupKey,
            {
              type: 'sprite',
              config: groupConfig,
              howl: new Howl({
                src: [audioFile(groupConfig.source)],
                sprite: groupConfig.sprites,
                volume: 1,
                pool: 6,
                onloaderror: () => {},
              }),
            },
          ];
        }

        return [
          groupKey,
          {
            type: 'variant',
            config: groupConfig,
            howls: groupConfig.sources.map(
              (source) =>
                new Howl({
                  src: [audioFile(source)],
                  volume: 1,
                  pool: 4,
                  onloaderror: () => {},
                })
            ),
          },
        ];
      }
    )
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

function playSoundEntry(soundEntry, { volume, rate }) {
  if (soundEntry.type === 'sprite') {
    const clipKey = pickRandomItem(soundEntry.config.clipKeys);
    const playbackId = soundEntry.howl.play(clipKey);

    soundEntry.howl.volume(volume, playbackId);
    soundEntry.howl.rate(rate, playbackId);
    return;
  }

  const howl = pickRandomItem(soundEntry.howls);
  const playbackId = howl.play();

  howl.volume(volume, playbackId);
  howl.rate(rate, playbackId);
}

export default function useDumpsterFireCollisionAudio() {
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

  const playCollision = useCallback(
    (payload) => {
      if (!audioEnabledRef.current) {
        return;
      }

      const body = payload?.other?.rigidBody;
      const { assetKey, slotIndex, isActiveThrowable, isTrashProjectile } =
        body?.userData ?? {};

      if (
        !isTrashProjectile ||
        !isActiveThrowable ||
        typeof assetKey !== 'string' ||
        typeof slotIndex !== 'number'
      ) {
        return;
      }

      const groupKey = getTrashCollisionAudioGroupKey(assetKey);
      const soundEntry = soundBank[groupKey];

      if (!soundEntry) {
        return;
      }

      const config = {
        ...DUMPSTER_FIRE_COLLISION_AUDIO_DEFAULTS,
        ...soundEntry.config,
      };
      const impactSpeed = getImpactSpeed(body);

      if (impactSpeed < config.minImpactSpeed) {
        return;
      }

      const collisionKey = `${assetKey}:${slotIndex}`;
      const now = performance.now();
      const lastPlaybackAt = lastPlaybackRef.current.get(collisionKey) ?? 0;

      if (now - lastPlaybackAt < config.cooldownMs) {
        return;
      }

      lastPlaybackRef.current.set(collisionKey, now);

      const volume = randomInRange(config.volumeRange);
      const rate = randomInRange(config.rateRange);

      playSoundEntry(soundEntry, { volume, rate });
    },
    [soundBank]
  );

  const playAssetPreview = useCallback(
    (assetKey) => {
      const groupKey = getTrashCollisionAudioGroupKey(assetKey);
      const soundEntry = soundBank[groupKey];

      if (!soundEntry) {
        return false;
      }

      const config = {
        ...DUMPSTER_FIRE_COLLISION_AUDIO_DEFAULTS,
        ...soundEntry.config,
      };

      playSoundEntry(soundEntry, {
        volume: midpoint(config.volumeRange),
        rate: midpoint(config.rateRange),
      });

      return true;
    },
    [soundBank]
  );

  return { playCollision, playAssetPreview };
}
