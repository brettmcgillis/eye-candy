import { create } from 'zustand';

const NOOP = () => {};

const useTrashBlasterStore = create((set, get) => ({
  hasThrowables: false,
  clearTrashHandler: NOOP,
  markThrowableSpawned: () => set({ hasThrowables: true }),
  setHasThrowables: (hasThrowables) => set({ hasThrowables }),
  registerClearTrashHandler: (clearTrashHandler) => set({ clearTrashHandler }),
  unregisterClearTrashHandler: () =>
    set({
      hasThrowables: false,
      clearTrashHandler: NOOP,
    }),
  clearTrash: () => {
    const { hasThrowables, clearTrashHandler } = get();

    if (!hasThrowables) {
      return;
    }

    clearTrashHandler();
    set({ hasThrowables: false });
  },
}));

export default useTrashBlasterStore;
