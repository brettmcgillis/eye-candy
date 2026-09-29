import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import createPostChain from './createPostChain';
import EFFECTS from './effects';

const scratchViewPoint = new THREE.Vector3();
const viewCentreNdc = new THREE.Vector2(0, 0);

function PostRig({
  post,
  values = {},
  lights = {},
  resolveFocusPoint = null,
  focusTarget = null,
}) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  const pipelineRef = useRef(null);
  const chainRef = useRef([]);
  const pointerPointRef = useRef(null);
  // Godrays can only build once its light has a shadow map, and a shadow map is
  // only allocated by a render — so the fallback render below is what breaks
  // that deadlock, and this flag re-runs the build once it appears.
  const [ready, setReady] = useState(0);
  const readyRef = useRef(0);

  const activeSlots = useMemo(
    () =>
      post?.enabled === false
        ? []
        : (post?.slots ?? []).filter((s) => s.enabled),
    [post]
  );
  const chainKey = useMemo(
    () =>
      JSON.stringify(activeSlots.map((s) => [s.id, s.type, s.blur, s.radius])),
    [activeSlots]
  );

  useEffect(() => {
    if (!renderer || !scene || !camera || activeSlots.length === 0) {
      pipelineRef.current = null;
      chainRef.current = [];
      return undefined;
    }

    const built = createPostChain({
      camera,
      lights,
      renderer,
      scene,
      slots: activeSlots,
    });

    if (!built) {
      pipelineRef.current = null;
      chainRef.current = [];
      return undefined;
    }

    const { chain, pipeline } = built;
    pipelineRef.current = pipeline;
    chainRef.current = chain;

    return () => {
      pipelineRef.current = null;
      chainRef.current = [];
    };
  }, [renderer, scene, camera, chainKey, lights, ready]);

  const toViewSpace = useCallback(
    (point) =>
      scratchViewPoint.copy(point).applyMatrix4(camera.matrixWorldInverse),
    [camera]
  );

  useEffect(() => {
    if (!resolveFocusPoint || !renderer?.domElement) return undefined;

    const element = renderer.domElement;
    const handlePointerDown = (event) => {
      const rect = element.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const point = resolveFocusPoint(ndc, camera);
      if (point) pointerPointRef.current = point.clone();
    };

    element.addEventListener('pointerdown', handlePointerDown);
    return () => element.removeEventListener('pointerdown', handlePointerDown);
  }, [camera, renderer, resolveFocusPoint]);

  useFrame((_, delta) => {
    const readiness = activeSlots.reduce((acc, slot) => {
      const effect = EFFECTS[slot.type];
      if (!effect?.isReady) return acc;
      return acc + (effect.isReady(slot, lights[slot.light]) ? 1 : 0);
    }, 0);

    if (readiness !== readyRef.current) {
      readyRef.current = readiness;
      setReady(readiness);
    }

    if (!pipelineRef.current) {
      renderer.render(scene, camera);
      return;
    }

    // Until the first click there is no pointer point, and an effect in
    // `pointer` mode would silently fall back to its manual distance — so a
    // scene that loads in pointer mode looks like the mode is not applied at
    // all. Seed it from the centre of the view instead, resolved here rather
    // than on mount so the camera rig has already placed the camera.
    if (resolveFocusPoint && pointerPointRef.current === null) {
      const centrePoint = resolveFocusPoint(viewCentreNdc, camera);
      if (centrePoint) pointerPointRef.current = centrePoint.clone();
    }

    // Both sources are offered every frame and each effect picks by its own
    // mode — collapsing them here made `target` and `pointer` behave
    // identically, since whichever happened to be set won.
    const frame = {
      delta,
      pointerPoint: pointerPointRef.current,
      targetPoint: focusTarget?.current ?? focusTarget ?? null,
      toViewSpace,
    };

    chainRef.current.forEach((entry) => entry.update(values, frame));

    pipelineRef.current.render();
  }, 1);

  return null;
}

export default memo(PostRig);
