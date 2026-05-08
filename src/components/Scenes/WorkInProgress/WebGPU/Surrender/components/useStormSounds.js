import { Howl } from 'howler';

import { useEffect, useMemo } from 'react';

import useSceneAudioStore from '../../../../../../store/useSceneAudioStore';
import { audioFile } from '../../../../../../utils/appUtils';

const FADE_MS = 2000;

export default function useStormSounds({
  rainVolume = 0.5,
  ambienceVolume = 0.4,
} = {}) {
  const setHasAudio = useSceneAudioStore((s) => s.setHasAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);

  const sounds = useMemo(
    () => ({
      rain: new Howl({
        src: [audioFile('thunder/rain.mp3')],
        loop: true,
        volume: 0,
        onloaderror: () => {},
      }),
      ambience: new Howl({
        src: [audioFile('thunder/night-ambience.mp3')],
        loop: true,
        volume: 0,
        onloaderror: () => {},
      }),
    }),
    []
  );

  // Register that this scene has audio, clean up on unmount
  useEffect(() => {
    setHasAudio(true);
    return () => {
      setHasAudio(false);
      sounds.rain.stop();
      sounds.ambience.stop();
      sounds.rain.unload();
      sounds.ambience.unload();
    };
  }, [sounds, setHasAudio]);

  // React to the user's audio toggle
  useEffect(() => {
    if (audioEnabled) {
      sounds.rain.play();
      sounds.rain.fade(0, rainVolume, FADE_MS);
      sounds.ambience.play();
      sounds.ambience.fade(0, ambienceVolume, FADE_MS);
    } else {
      sounds.rain.fade(rainVolume, 0, FADE_MS);
      sounds.ambience.fade(ambienceVolume, 0, FADE_MS);
      setTimeout(() => {
        sounds.rain.stop();
        sounds.ambience.stop();
      }, FADE_MS);
    }
  }, [audioEnabled, sounds, rainVolume, ambienceVolume]);
}
