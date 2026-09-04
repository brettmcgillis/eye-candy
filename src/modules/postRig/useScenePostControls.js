import { useCallback, useMemo } from 'react';

import buildScenePostControls from './buildScenePostControls';
import EFFECTS from './effects';
import {
  buildScenePostRuntimeConfig,
  normalizeScenePostDeclaration,
} from './scenePostUtils';

export default function useScenePostControls({ controlsSnapshotRef, post }) {
  // Read once, like the camera and lighting rigs: the snapshot is the active
  // preset when this first runs, and re-seeding the schema on every later edit
  // would fight the user's own changes.
  const postControls = useMemo(
    () =>
      buildScenePostControls({
        controlOverrides: controlsSnapshotRef?.current ?? {},
        post,
      }),
    [post]
  );

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
