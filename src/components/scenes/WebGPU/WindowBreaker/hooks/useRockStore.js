import { create } from 'zustand';

const NOOP = () => {};

// Bridges the overlay buttons to RockProjectiles' imperative handlers.
const useRockStore = create((set, get) => ({
  hasRocks: false,
  fireHandler: NOOP,
  clearHandler: NOOP,
  setHasRocks: (hasRocks) => set({ hasRocks }),
  registerFire: (fireHandler) => set({ fireHandler }),
  unregisterFire: () => set({ fireHandler: NOOP }),
  registerClear: (clearHandler) => set({ clearHandler }),
  unregisterClear: () => set({ clearHandler: NOOP, hasRocks: false }),
  fire: () => get().fireHandler(),
  clear: () => {
    get().clearHandler();
    set({ hasRocks: false });
  },
}));

export default useRockStore;
