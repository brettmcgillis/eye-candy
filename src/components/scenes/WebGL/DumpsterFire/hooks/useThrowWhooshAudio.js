import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Howl } from 'howler';

import { DUMPSTER_FIRE_THROW_WHOOSH } from '@modules/trashAudio';
import useSceneAudioStore from '@store/useSceneAudioStore';
import { audioFile } from '@utils/appUtils';

function randomInRange([min, max]) {
  return min + Math.random() * (max - min);
}

const { sources, volumeRange, rateRange, cooldownMs, pool } =
  DUMPSTER_FIRE_THROW_WHOOSH;

export default function useThrowWhooshAudio() {
  const registerAudio = useSceneAudioStore((s) => s.registerAudio);
  const unregisterAudio = useSceneAudioStore((s) => s.unregisterAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const audioEnabledRef = useRef(audioEnabled);
  const lastPlayedAtRef = useRef(0);

  const howls = useMemo(
    () =>
      sources.map(
        (source) =>
          new Howl({
            src: [audioFile(source)],
            volume: 1,
            pool,
            onloaderror: () => {},
          })
      ),
    []
  );

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    registerAudio();

    return () => {
      unregisterAudio();
      howls.forEach((howl) => {
        howl.stop();
        howl.unload();
      });
    };
  }, [howls, registerAudio, unregisterAudio]);

  return useCallback(
    (enabled = true) => {
      if (!enabled || !audioEnabledRef.current) {
        return;
      }

      const now = performance.now();

      if (now - lastPlayedAtRef.current < cooldownMs) {
        return;
      }

      lastPlayedAtRef.current = now;

      const howl = howls[Math.floor(Math.random() * howls.length)];
      const playbackId = howl.play();

      howl.volume(randomInRange(volumeRange), playbackId);
      howl.rate(randomInRange(rateRange), playbackId);
    },
    [howls]
  );
}
