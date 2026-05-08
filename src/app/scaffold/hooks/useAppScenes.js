import { folder, useControls } from 'leva';

import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { localEnv } from '../../../utils/appUtils';
import useScenes, { AREAS, CHANNELS } from '../../useScenes';
import WebGLCanvas from '../canvas/WebGLCanvas';
import WebGPUCanvas from '../canvas/WebGPUCanvas';

const DEFAULT_SCENE = 'loGlow';
const IG_QUERY_PARAM = 'ig';

const IG_OPTIONS = {
  Off: '',
  Story: 'story',
  Reel: 'reel',
  Post: 'post',
};

// Flat map: sceneId → { channel, area, sceneDef }
// First match wins — webgl is listed before webgpu in useScenes, so webgl
// wins for the three IDs that exist in both renderers.
function buildFlatMap(registry) {
  const map = {};
  for (const [channel, areas] of Object.entries(registry)) {
    for (const [area, scenes] of Object.entries(areas)) {
      for (const scene of scenes) {
        if (!map[scene.id]) {
          map[scene.id] = { channel, area, sceneDef: scene };
        }
      }
    }
  }
  return map;
}

export default function useAppScenes() {
  const local = localEnv();
  const registry = useScenes();
  const navigate = useNavigate();
  const { sceneId: routeSceneId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- flat registry lookup ---

  const flatMap = useMemo(() => buildFlatMap(registry), [registry]);

  const match = flatMap[routeSceneId] ??
    flatMap[DEFAULT_SCENE] ?? {
      channel: 'webgl',
      area: 'showcase',
      sceneDef: null,
    };

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
  }, [routeSceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- scene dropdown (rebuilds when mode/area change) ---

  const scenes = useMemo(
    () => registry[mode]?.[area] ?? [],
    [registry, mode, area]
  );

  const sceneOptions = useMemo(
    () => Object.fromEntries(scenes.map((s) => [s.label ?? s.id, s.id])),
    [scenes]
  );

  const sceneDefault = useMemo(() => {
    if (scenes.some((s) => s.id === routeSceneId)) return routeSceneId;
    if (scenes.some((s) => s.id === DEFAULT_SCENE)) return DEFAULT_SCENE;
    return scenes[0]?.id ?? 'noScene';
  }, [scenes, routeSceneId]);

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

  useEffect(() => {
    if (!sceneMap[levaSceneId]) {
      setSceneControl({ scene: sceneDefault });
    }
  }, [levaSceneId, sceneMap, sceneDefault, setSceneControl]);

  // Navigate when Leva scene dropdown changes
  const prevLevaScene = useRef(levaSceneId);
  useEffect(() => {
    if (levaSceneId !== prevLevaScene.current && sceneMap[levaSceneId]) {
      prevLevaScene.current = levaSceneId;
      navigate(`/${levaSceneId}`);
    }
  }, [levaSceneId, navigate, sceneMap]);

  // Navigate when mode/area changes and the current route scene isn't in the new list
  useEffect(() => {
    if (!scenes.some((s) => s.id === routeSceneId)) {
      navigate(`/${sceneDefault}`, { replace: true });
    }
  }, [mode, area]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [ig]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- resolve ---

  const CanvasWrapper = match.channel === 'webgpu' ? WebGPUCanvas : WebGLCanvas;

  return {
    local,
    channel: match.channel,
    area: match.area,
    sceneId: routeSceneId,
    sceneDef: match.sceneDef,
    SceneComponent: match.sceneDef?.Component,
    CanvasWrapper,
    renderer: match.channel,
  };
}
