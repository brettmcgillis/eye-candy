import { create } from 'zustand';

const NOOP = () => {};

const useTrashBlasterStore = create((set, get) => ({
  hasThrowables: false,
  isPointerInteractionActive: false,
  cleanupNonce: 0,
  clearTrashHandler: NOOP,
  interactiveTargets: {},
  markThrowableSpawned: () => set({ hasThrowables: true }),
  setHasThrowables: (hasThrowables) => set({ hasThrowables }),
  setPointerInteractionActive: (isPointerInteractionActive) =>
    set({ isPointerInteractionActive }),
  registerInteractiveTarget: (targetId, target) =>
    set((state) => ({
      interactiveTargets: {
        ...state.interactiveTargets,
        [targetId]: target,
      },
    })),
  unregisterInteractiveTarget: (targetId) =>
    set((state) => {
      if (!state.interactiveTargets[targetId]) {
        return state;
      }

      const nextInteractiveTargets = { ...state.interactiveTargets };
      delete nextInteractiveTargets[targetId];

      return {
        interactiveTargets: nextInteractiveTargets,
      };
    }),
  registerClearTrashHandler: (clearTrashHandler) => set({ clearTrashHandler }),
  unregisterClearTrashHandler: () =>
    set({
      hasThrowables: false,
      clearTrashHandler: NOOP,
    }),
  clearTrash: () => {
    const { cleanupNonce, clearTrashHandler } = get();

    clearTrashHandler();
    set({
      cleanupNonce: cleanupNonce + 1,
      hasThrowables: false,
    });
  },
}));

export default useTrashBlasterStore;
