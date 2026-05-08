import { create } from 'zustand';

const useSceneAudioStore = create((set) => ({
  hasAudio: false,
  audioEnabled: false,
  setHasAudio: (v) => set({ hasAudio: v }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
}));

export default useSceneAudioStore;
