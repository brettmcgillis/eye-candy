import { create } from 'zustand';

const useMediaRecorderStore = create((set) => ({
  isRecording: false,
  setRecording: (isRecording) => set({ isRecording }),
}));

export default useMediaRecorderStore;
