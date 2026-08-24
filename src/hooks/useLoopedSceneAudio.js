import { useEffect, useRef } from 'react';

import { Howl } from 'howler';

import useSceneAudioStore from '@store/useSceneAudioStore';
import { audioFile } from '@utils/appUtils';

const FADE_MS = 2000;

export default function useLoopedSceneAudio(src, { volume = 0.5 } = {}) {
  const registerAudio = useSceneAudioStore((s) => s.registerAudio);
  const unregisterAudio = useSceneAudioStore((s) => s.unregisterAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const soundRef = useRef(null);

  useEffect(() => {
    if (!src) {
      return undefined;
    }

    const howl = new Howl({
      src: [audioFile(src)],
      loop: true,
      volume: 0,
      onloaderror: () => {},
    });

    soundRef.current = howl;

    return () => {
      howl.stop();
      howl.unload();
      soundRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (!src) {
      return undefined;
    }

    registerAudio();

    return () => unregisterAudio();
  }, [src, registerAudio, unregisterAudio]);

  useEffect(() => {
    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    if (audioEnabled) {
      sound.play();
      sound.fade(0, volume, FADE_MS);
    } else {
      sound.fade(volume, 0, FADE_MS);
      setTimeout(() => sound.stop(), FADE_MS);
    }
  }, [src, audioEnabled, volume]);
}
