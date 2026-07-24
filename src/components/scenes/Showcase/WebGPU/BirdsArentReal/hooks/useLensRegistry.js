import * as THREE from 'three';

import { useMemo, useRef } from 'react';

/**
 * Live registry of each bird's swept lens group. FakeBird/CameraHead register their
 * lens node through a per-bird callback (keyed by bird key); BirdPovRig reads the map
 * to ride the active bird's lens. Also hands back the shared world point the flock
 * stares at in Cursor-Follow mode.
 *
 * `birdKeys` is the comma-joined list of bird keys — the callbacks are rebuilt only
 * when that set changes, so attaching a node never churns every render.
 */
export default function useLensRegistry(birdKeys) {
  const nodesRef = useRef(new Map());
  const cursorTargetRef = useRef(new THREE.Vector3());

  const callbacks = useMemo(() => {
    const map = {};
    birdKeys
      .split(',')
      .filter(Boolean)
      .forEach((key) => {
        map[key] = (node) => {
          if (node) nodesRef.current.set(key, node);
          else nodesRef.current.delete(key);
        };
      });
    return map;
  }, [birdKeys]);

  return { nodesRef, cursorTargetRef, callbacks };
}
