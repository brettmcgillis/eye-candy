import React, { useEffect, useMemo, useRef } from 'react';
import { IoInvertMode, IoInvertModeOutline } from 'react-icons/io5';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { buttonGroup, folder, useControls } from 'leva';

import { localEnv } from '@utils/appUtils';

import sceneRegistry, {
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

  // Stable refs so buttonGroup handlers don't go stale
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  const matchRef = useRef(match);
  useEffect(() => {
    matchRef.current = match;
  }, [match]);
  // Set by buttonGroup handlers to suppress the stale levaSceneId that Leva
  // preserves in the store across channel/area reinits.
  const buttonNavRef = useRef(false);

  const noSceneFor = (channel, area) =>
    sceneRegistry.byArea?.[channel]?.[area]?.find((s) => s.id === 'noScene') ??
    sceneRegistry.defaultScene;

  useControls(
    'App',
    () => ({
      Mode: buttonGroup({
        label: <IoInvertMode />,
        opts: {
          WebGL: () => {
            const m = matchRef.current;
            buttonNavRef.current = true;
            navigateRef.current(noSceneFor('webgl', m.area).path, {
              replace: true,
            });
          },
          WebGPU: () => {
            const m = matchRef.current;
            buttonNavRef.current = true;
            navigateRef.current(noSceneFor('webgpu', m.area).path, {
              replace: true,
            });
          },
        },
      }),
      Area: buttonGroup({
        label: <IoInvertModeOutline />,
        opts: {
          Showcase: () => {
            const m = matchRef.current;
            buttonNavRef.current = true;
            navigateRef.current(noSceneFor(m.channel, 'showcase').path, {
              replace: true,
            });
          },
          WIP: () => {
            const m = matchRef.current;
            buttonNavRef.current = true;
            navigateRef.current(noSceneFor(m.channel, 'wip').path, {
              replace: true,
            });
          },
        },
      }),
      Area2: buttonGroup({
        label: '',
        opts: {
          TestLab: () => {
            const m = matchRef.current;
            buttonNavRef.current = true;
            navigateRef.current(noSceneFor(m.channel, 'testlab').path, {
              replace: true,
            });
          },
          Toolbox: () => {
            const m = matchRef.current;
            buttonNavRef.current = true;
            navigateRef.current(noSceneFor(m.channel, 'toolbox').path, {
              replace: true,
            });
          },
        },
      }),
    }),
    { collapsed: true, render: () => local },
    []
  );

  // --- scene dropdown (rebuilds when channel/area change) ---

  const scenes = useMemo(
    () => sceneRegistry.byArea[match.channel]?.[match.area] ?? [],
    [match.channel, match.area]
  );

  const sceneOptions = useMemo(
    () => Object.fromEntries(scenes.map((s) => [s.label ?? s.id, s.id])),
    [scenes]
  );

  const areaDefaultScene =
    sceneRegistry.areaDefaults[match.channel]?.[match.area] ||
    sceneRegistry.defaultScene;

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
    [match.channel, match.area]
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
    if (buttonNavRef.current) {
      buttonNavRef.current = false;
      return;
    }
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
