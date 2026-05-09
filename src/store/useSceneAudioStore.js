import { create } from 'zustand';

const useSceneAudioStore = create((set) => ({
  audioSources: 0,
  hasAudio: false,
  audioEnabled: false,
  registerAudio: () =>
    set((s) => ({ audioSources: s.audioSources + 1, hasAudio: true })),
  unregisterAudio: () =>
    set((s) => {
      const audioSources = Math.max(0, s.audioSources - 1);
      return { audioSources, hasAudio: audioSources > 0 };
    }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
}));

export default useSceneAudioStore;
