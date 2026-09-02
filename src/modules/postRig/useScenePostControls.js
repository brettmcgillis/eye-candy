import { useCallback, useMemo } from 'react';

import buildScenePostControls from './buildScenePostControls';
import EFFECTS from './effects';
import {
  buildScenePostRuntimeConfig,
  normalizeScenePostDeclaration,
} from './scenePostUtils';

export default function useScenePostControls({ post }) {
  const postControls = useMemo(() => buildScenePostControls({ post }), [post]);

  const buildPost = useCallback(
    (controls = {}) => {
      const runtime = buildScenePostRuntimeConfig(post, controls);

      return {
        ...runtime,
        slots: runtime.slots.map((slot) => ({
          ...EFFECTS[slot.type]?.defaults,
          ...slot,
        })),
      };
    },
    [post]
  );

  return {
    buildPost,
    postControls,
    slots: normalizeScenePostDeclaration(post).slots,
  };
}
