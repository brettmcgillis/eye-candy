import { folder, useControls } from 'leva';

import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { localEnv } from '../../../utils/appUtils';
import sceneRegistry, {
  AREAS,
  CHANNELS,
  resolveLegacyScenePath,
  resolveScenePath,
} from '../../sceneRegistry';
import WebGLCanvas from '../canvas/WebGLCanvas';
import WebGPUCanvas from '../canvas/WebGPUCanvas';

const IG_QUERY_PARAM = 'ig';

const IG_OPTIONS = {
  Off: '',
  Story: 'story',
  Reel: 'reel',
  Post: 'post',
};

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
}

export default function useAppScenes() {
  const local = localEnv();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPath = normalizePath(location.pathname);

  const routeMatch = useMemo(
    () => resolveScenePath(currentPath),
    [currentPath]
  );

  const redirectPath = useMemo(() => {
    if (routeMatch) return null;

    const pathSegments = currentPath.split('/').filter(Boolean);

    if (pathSegments.length === 1) {
      return (
        resolveLegacyScenePath(pathSegments[0]) ||
        sceneRegistry.defaultScene?.path ||
        null
      );
    }

    return sceneRegistry.defaultScene?.path || null;
  }, [currentPath, routeMatch]);

  const match = routeMatch || sceneRegistry.defaultScene;

  // --- Leva option maps ---

  const channelOptions = useMemo(
    () => Object.fromEntries(Object.entries(CHANNELS).map(([k, v]) => [v, k])),
    []
  );
  const areaOptions = useMemo(
    () => Object.fromEntries(Object.entries(AREAS).map(([k, v]) => [v, k])),
    []
  );

  // --- Leva controls ---

  const { ig } = useControls(
    'App',
    {
      Overlay: folder(
        {
          ig: {
            label: 'IG Preset',
            options: IG_OPTIONS,
            value: searchParams.get(IG_QUERY_PARAM) ?? '',
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true, render: () => local }
  );

  const [{ mode, area }, setNav] = useControls(
    'App',
    () => ({
      mode: { options: channelOptions, value: match.channel },
      area: { options: areaOptions, value: match.area },
    }),
    { collapsed: true, render: () => local },
    []
  );

  // Sync Leva mode/area when the URL changes (browser back/forward)
  useEffect(() => {
    setNav({ mode: match.channel, area: match.area });
  }, [match.area, match.channel, setNav]);

  // --- scene dropdown (rebuilds when mode/area change) ---

  const scenes = useMemo(
    () => sceneRegistry.byArea[mode]?.[area] ?? [],
    [mode, area]
  );

  const sceneOptions = useMemo(
    () => Object.fromEntries(scenes.map((s) => [s.label ?? s.id, s.id])),
    [scenes]
  );

  const areaDefaultScene =
    sceneRegistry.areaDefaults[mode]?.[area] || sceneRegistry.defaultScene;

  const sceneDefault = useMemo(() => {
    if (scenes.some((scene) => scene.id === match?.id)) return match.id;
    if (
      areaDefaultScene?.id &&
      scenes.some((scene) => scene.id === areaDefaultScene.id)
    ) {
      return areaDefaultScene.id;
    }
    return scenes[0]?.id ?? 'noScene';
  }, [areaDefaultScene, match?.id, scenes]);

  const [{ scene: levaSceneId }, setSceneControl] = useControls(
    'App',
    () => ({ scene: { options: sceneOptions, value: sceneDefault } }),
    { collapsed: true, render: () => local },
    [mode, area]
  );

  // Guard stale Leva scene value after area/channel switch
  const sceneMap = useMemo(
    () => Object.fromEntries(scenes.map((s) => [s.id, s])),
    [scenes]
  );

  const prevLevaScene = useRef(sceneDefault);

  useEffect(() => {
    const nextSceneId = sceneMap[match?.id] ? match.id : sceneDefault;

    if (!nextSceneId || prevLevaScene.current === nextSceneId) return;

    prevLevaScene.current = nextSceneId;
    setSceneControl({ scene: nextSceneId });
  }, [match?.id, match?.path, sceneDefault, sceneMap, setSceneControl]);

  // Navigate when Leva scene dropdown changes
  useEffect(() => {
    if (
      !redirectPath &&
      levaSceneId !== prevLevaScene.current &&
      sceneMap[levaSceneId]
    ) {
      prevLevaScene.current = levaSceneId;
      if (sceneMap[levaSceneId].path !== currentPath) {
        navigate(sceneMap[levaSceneId].path);
      }
    }
  }, [currentPath, levaSceneId, navigate, redirectPath, sceneMap]);

  // Navigate when mode/area changes and the current route is no longer the selected scene.
  useEffect(() => {
    if (redirectPath) return;

    const currentScene = sceneMap[match?.id];
    const nextScene = currentScene || areaDefaultScene;

    if (nextScene?.path && nextScene.path !== currentPath) {
      navigate(nextScene.path, { replace: true });
    }
  }, [
    area,
    areaDefaultScene,
    currentPath,
    match?.id,
    mode,
    navigate,
    redirectPath,
    sceneMap,
  ]);

  // --- ig → search param ---

  useEffect(() => {
    setSearchParams(
      (prev) => {
        if (ig) prev.set(IG_QUERY_PARAM, ig);
        else prev.delete(IG_QUERY_PARAM);
        return prev;
      },
      { replace: true }
    );
  }, [ig]);

  // --- resolve ---

  const CanvasWrapper = match.channel === 'webgpu' ? WebGPUCanvas : WebGLCanvas;

  return {
    local,
    redirectPath,
    channel: match.channel,
    area: match.area,
    sceneId: match.id,
    sceneDef: match,
    SceneComponent: match?.Component,
    CanvasWrapper,
    renderer: match.channel,
  };
}
