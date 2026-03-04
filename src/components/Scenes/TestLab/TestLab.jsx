import { useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import { localEnv } from '../../../utils/appUtils';

function getSceneFromQuery(queryParam) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(queryParam);
}

export default function useTestLabSceneSelector({
  scenes,
  defaultSceneId,
  groupLabel,
  queryParam,
}) {
  const local = localEnv();

  const sceneMap = useMemo(() => {
    return Object.fromEntries(scenes.map((scene) => [scene.id, scene]));
  }, [scenes]);

  const dropdownOptions = useMemo(() => {
    return Object.fromEntries(
      scenes.map((scene) => [scene.label ?? scene.id, scene.id])
    );
  }, [scenes]);

  const initialScene = useMemo(() => {
    const requested = getSceneFromQuery(queryParam);

    if (requested && sceneMap[requested]) {
      return requested;
    }

    if (defaultSceneId && sceneMap[defaultSceneId]) {
      return defaultSceneId;
    }

    return scenes[0]?.id;
  }, [defaultSceneId, queryParam, sceneMap, scenes]);

  const [{ scene: selectedSceneId = initialScene }, setControls] = useControls(
    groupLabel,
    () => ({
      scene: {
        options: dropdownOptions,
        value: initialScene,
      },
    }),
    { collapsed: true, render: () => local }
  );

  const sceneId = sceneMap[selectedSceneId] ? selectedSceneId : initialScene;

  useEffect(() => {
    if (!initialScene) return;
    if (sceneMap[selectedSceneId]) return;
    setControls({ scene: initialScene });
  }, [initialScene, sceneMap, selectedSceneId, setControls]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set(queryParam, sceneId);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [queryParam, sceneId]);

  return {
    sceneId,
    sceneMap,
    sceneDef: sceneMap[sceneId],
    SceneComponent: sceneMap[sceneId]?.Component,
  };
}
