import { useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import { localEnv } from '../../../utils/appUtils';
import useScenes from '../../useScenes';
import WebGLCanvas from '../canvas/WebGLCanvas';
import WebGPUCanvas from '../canvas/WebGPUCanvas';

const DEFAULT_SCENE_ID = 'loGlow';

function getSceneFromQuery() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('scene');
}

export default function useAppScenes() {
  const local = localEnv();
  const { scenes } = useScenes();

  // index scenes by id for fast lookup
  const sceneMap = useMemo(() => {
    return Object.fromEntries(scenes.map((s) => [s.id, s]));
  }, [scenes]);

  // scenes allowed in dropdown
  const dropdownScenes = useMemo(() => {
    return local ? scenes : scenes.filter((s) => s.public);
  }, [local, scenes]);

  const dropdownOptions = useMemo(() => {
    return Object.fromEntries(
      dropdownScenes.map((s) => [`${s.label ?? s.id}`, s.id])
    );
  }, [dropdownScenes]);

  // determine initial scene
  const initialScene = useMemo(() => {
    const requested = getSceneFromQuery();

    // 1. Explicit query string always wins (if allowed)
    if (requested && sceneMap[requested]) {
      const scene = sceneMap[requested];

      if (local) return scene.id;
      if (scene.linkable) return scene.id;
    }

    // 2. No query string → explicit default
    if (!requested && !local && sceneMap[DEFAULT_SCENE_ID]) {
      return sceneMap[DEFAULT_SCENE_ID].id;
    }

    // 3. Final fallback: first public + linkable scene
    const fallback = scenes.find((s) => s.public && s.linkable);

    return fallback?.id ?? scenes[0]?.id;
  }, [local, sceneMap, scenes]);

  const { scene: sceneId = initialScene } = useControls(
    'Scene Selection',
    {
      scene: {
        options: dropdownOptions,
        value: initialScene,
      },
    },
    { collapsed: true, render: () => local }
  );

  // keep query string in sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('scene', sceneId);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [sceneId]);

  const sceneDef = sceneMap[sceneId];
  const renderer = sceneDef?.renderer ?? 'webgl';
  const SceneComponent = sceneDef?.Component;
  const CanvasWrapper = renderer === 'webgpu' ? WebGPUCanvas : WebGLCanvas;

  return {
    local,
    scenes,
    sceneMap,
    dropdownScenes,
    dropdownOptions,
    sceneId,
    sceneDef,
    renderer,
    SceneComponent,
    CanvasWrapper,
  };
}
