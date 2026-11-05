/* eslint-disable no-param-reassign */
import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { SCREEN_ASPECT } from '../utils/rig';

const aim = new THREE.Vector3();

function FeedRenderer({ feed, channel, fps, fov }) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const clock = useThree((state) => state.clock);
  const camera = useMemo(
    () => new THREE.PerspectiveCamera(fov, SCREEN_ASPECT, 0.02, 30),
    []
  );
  const elapsed = useRef(Infinity);

  useEffect(() => {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, fov]);

  useEffect(() => {
    feed.switchedAt = clock.elapsedTime;
    elapsed.current = Infinity;
  }, [channel, clock, feed]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 1 / fps) return;
    elapsed.current = 0;

    const lens = feed.lenses.get(channel - 1);
    if (!lens) return;
    lens.eye.getWorldPosition(camera.position);
    lens.aim.getWorldPosition(aim);
    camera.lookAt(aim);
    camera.updateMatrixWorld();

    const target = feed.targets[feed.write];
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(previous);
    feed.textureNode.value = target.texture;
    feed.write = 1 - feed.write;
  });

  return null;
}

export default memo(FeedRenderer);
