import * as THREE from 'three';
import { create } from 'zustand';

import type React from 'react';

type RideableState = {
  mountedId: string | null;
  mountedGroupRef: React.RefObject<THREE.Group> | null;
  mount: (id: string, groupRef: React.RefObject<THREE.Group>) => void;
  dismount: () => void;
};

export const useRideableState = create<RideableState>((set) => ({
  mountedId: null,
  mountedGroupRef: null,
  mount: (id, groupRef) => set({ mountedId: id, mountedGroupRef: groupRef }),
  dismount: () => set({ mountedId: null, mountedGroupRef: null }),
}));
