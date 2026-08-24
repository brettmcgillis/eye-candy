import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Howl } from 'howler';

import useSceneAudioStore from '@store/useSceneAudioStore';
import { audioFile } from '@utils/appUtils';

// Loops sprayCanSpray.mp3 while the user is actually spraying (todo item 60).
// Registers with the global scene-audio store, which makes the scaffold's
// own overlay AudioToggle appear — audio stays off until the user enables
// it there (todo item 61), same pattern as Surrender's useStormSounds.
export default function useSpraySound({ volume = 0.6 } = {}) {
  const registerAudio = useSceneAudioStore((s) => s.registerAudio);
  const unregisterAudio = useSceneAudioStore((s) => s.unregisterAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);

  const sound = useMemo(
    () =>
      new Howl({
        src: [audioFile('sprayCanSpray.mp3')],
        loop: true,
        volume,
        onloaderror: () => {},
      }),
    [volume]
  );

  const sprayingRef = useRef(false);
  const audioEnabledRef = useRef(audioEnabled);

  useEffect(() => {
    registerAudio();
    return () => {
      unregisterAudio();
      sound.stop();
      sound.unload();
    };
  }, [sound, registerAudio, unregisterAudio]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
    if (!audioEnabled) {
      sound.stop();
    } else if (sprayingRef.current && !sound.playing()) {
      sound.play();
    }
  }, [audioEnabled, sound]);

  return useCallback(
    (spraying) => {
      sprayingRef.current = spraying;
      if (!audioEnabledRef.current) return;
      if (spraying && !sound.playing()) sound.play();
      if (!spraying) sound.stop();
    },
    [sound]
  );
}
