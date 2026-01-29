import { useControls } from 'leva';

import React, { Suspense, useEffect, useMemo } from 'react';

import { isLocalHost } from '../utils/appUtils';
import './App.css';
import WebGLCanvas from './scaffold/canvas/WebGLCanvas';
import WebGPUCanvas from './scaffold/canvas/WebGPUCanvas';
import Loader from './scaffold/loader/Loader';
import useScenes from './useScenes';

/* ---------------------------------------------
   Query helpers
---------------------------------------------- */

function getSceneFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('scene');
}

/* ---------------------------------------------
   App
---------------------------------------------- */
const DEFAULT_SCENE_ID = 'loGlow';

function App() {
  const local = isLocalHost();
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

    return fallback?.id ?? scenes[0].id;
  }, [local, sceneMap, scenes]);

  const { scene } = useControls(
    'Scene Selection',
    {
      scene: {
        options: dropdownOptions,
        value: initialScene,
      },
    },
    // Consider removing this to allow people to check other scenes
    { render: () => local }
  );

  // keep query string in sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('scene', scene);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [scene]);

  const sceneDef = sceneMap[scene];
  const renderer = sceneDef?.renderer ?? 'webgl';
  const SceneComponent = sceneDef?.Component;

  const CanvasWrapper = renderer === 'webgpu' ? WebGPUCanvas : WebGLCanvas;

  return (
    <div className="App">
      <CanvasWrapper key={renderer}>
        <Suspense fallback={<Loader />}>
          {SceneComponent && <SceneComponent />}
        </Suspense>
      </CanvasWrapper>
    </div>
  );
}

export default App;
