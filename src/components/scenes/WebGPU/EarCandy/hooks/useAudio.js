import { useEffect, useMemo } from 'react';

import useSceneAudioStore from '@store/useSceneAudioStore';

import createAudio from '../utils/audio/engine';

export default function useAudio({ bpm, delay, reverb, volume }) {
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const registerAudio = useSceneAudioStore((s) => s.registerAudio);
  const unregisterAudio = useSceneAudioStore((s) => s.unregisterAudio);
  const audio = useMemo(createAudio, []);

  useEffect(() => {
    registerAudio();
    audio.mount();
    return () => {
      audio.dispose();
      unregisterAudio();
    };
  }, [audio, registerAudio, unregisterAudio]);

  useEffect(() => {
    audio.setEnabled(audioEnabled);
  }, [audio, audioEnabled]);

  useEffect(() => {
    audio.setParams({ bpm, delay, reverb, volume });
  }, [audio, bpm, delay, reverb, volume]);

  return audio;
}
