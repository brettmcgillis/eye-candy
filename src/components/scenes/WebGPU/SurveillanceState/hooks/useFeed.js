/* eslint-disable no-param-reassign */
import { useEffect, useMemo } from 'react';

import { texture } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { SCREEN_ASPECT } from '../utils/rig';

function createTargets(resolution) {
  const height = Math.round(resolution);
  const width = Math.round(resolution * SCREEN_ASPECT);
  return [0, 1].map(
    () =>
      new THREE.RenderTarget(width, height, {
        type: THREE.HalfFloatType,
        depthBuffer: true,
      })
  );
}

// Two targets, ping-ponged: the feed camera always renders the TV while the
// screen samples last frame's target, so the picture can contain itself.
export default function useFeed(resolution) {
  const feed = useMemo(() => {
    const targets = createTargets(256);
    return {
      targets,
      textureNode: texture(targets[0].texture),
      write: 1,
      lenses: new Map(),
      switchedAt: -100,
    };
  }, []);

  useEffect(() => {
    const previous = feed.targets;
    feed.targets = createTargets(resolution);
    feed.write = 1;
    feed.textureNode.value = feed.targets[0].texture;
    previous.forEach((target) => target.dispose());
  }, [feed, resolution]);

  useEffect(() => () => feed.targets.forEach((t) => t.dispose()), [feed]);

  return feed;
}
