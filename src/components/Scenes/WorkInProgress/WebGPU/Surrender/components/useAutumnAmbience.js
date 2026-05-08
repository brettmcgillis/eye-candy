import { Howl } from 'howler';

import { useEffect, useMemo } from 'react';

import useSceneAudioStore from '../../../../../../store/useSceneAudioStore';
import { audioFile } from '../../../../../../utils/appUtils';

const FADE_MS = 2000;

export default function useAutumnAmbience({
  enabled = false,
  volume = 0.5,
} = {}) {
  const setHasAudio = useSceneAudioStore((s) => s.setHasAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);

  const sound = useMemo(
    () =>
      new Howl({
        src: [audioFile('wind-and-leaves.mp3')],
        loop: true,
        volume: 0,
        onloaderror: () => {},
      }),
    []
  );

  useEffect(() => {
    if (!enabled) return;
    setHasAudio(true);
    return () => {
      setHasAudio(false);
      sound.stop();
    };
  }, [enabled, sound, setHasAudio]);

  useEffect(() => {
    return () => sound.unload();
  }, [sound]);

  useEffect(() => {
    if (!enabled) return;
    if (audioEnabled) {
      sound.play();
      sound.fade(0, volume, FADE_MS);
    } else {
      sound.fade(volume, 0, FADE_MS);
      setTimeout(() => sound.stop(), FADE_MS);
    }
  }, [enabled, audioEnabled, sound, volume]);
}
