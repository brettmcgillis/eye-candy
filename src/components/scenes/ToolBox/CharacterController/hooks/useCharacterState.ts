import { create } from 'zustand';

export interface CharacterState {
  position: { x: number; y: number; z: number };
  rotation: number;
  velocity: { x: number; z: number };
  jumping: boolean;
  sprinting: boolean;
}

export const useCharacterState = create<{
  state: CharacterState;
  setState: (state: Partial<CharacterState>) => void;
}>((set) => ({
  state: {
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    velocity: { x: 0, z: 0 },
    jumping: false,
    sprinting: false,
  },
  setState: (newState) =>
    set((state) => ({
      state: { ...state.state, ...newState },
    })),
}));
