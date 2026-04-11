import { useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import { localEnv } from '../../../utils/appUtils';
import useScenes, { AREAS, CHANNELS } from '../../useScenes';
import WebGLCanvas from '../canvas/WebGLCanvas';
import WebGPUCanvas from '../canvas/WebGPUCanvas';

const DEFAULT_CHANNEL = 'webgl';
const DEFAULT_AREA = 'showcase';
const DEFAULT_SCENE = 'loGlow';
const IG_QUERY_PARAM = 'ig';

const IG_OPTIONS = {
  Off: '',
  Story: 'story',
  Reel: 'reel',
  Post: 'post',
};

function getQueryParam(key) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export default function useAppScenes() {
  const local = localEnv();
  const registry = useScenes();

  // --- initial values from URL (captured once) ---

  const initialChannel = useMemo(() => {
    const mode = getQueryParam('mode');
    return mode && mode in registry ? mode : DEFAULT_CHANNEL;
  }, []);

  const initialArea = useMemo(() => {
    const raw = getQueryParam('area');
    return raw && raw in AREAS ? raw : DEFAULT_AREA;
  }, []);

  const initialScene = useMemo(() => {
    const raw = getQueryParam('scene');
    const scenes = registry[initialChannel]?.[initialArea] ?? [];
    if (raw && scenes.some((s) => s.id === raw)) return raw;
    if (scenes.some((s) => s.id === DEFAULT_SCENE)) return DEFAULT_SCENE;
    return scenes[0]?.id ?? 'noScene';
  }, []);

  const initialIgPreset = useMemo(() => {
    const raw = getQueryParam(IG_QUERY_PARAM);
    if (!raw) return '';

    const normalized = raw.trim().toLowerCase();
    return Object.values(IG_OPTIONS).includes(normalized) ? normalized : '';
  }, []);

  // --- Leva controls ---

  const channelOptions = useMemo(
    () => Object.fromEntries(Object.entries(CHANNELS).map(([k, v]) => [v, k])),
    []
  );

  const areaOptions = useMemo(
    () => Object.fromEntries(Object.entries(AREAS).map(([k, v]) => [v, k])),
    []
  );

  const { mode, area, ig } = useControls(
    'App',
    {
      mode: { options: channelOptions, value: initialChannel },
      area: { options: areaOptions, value: initialArea },
      ig: {
        label: 'IG Preset',
        options: IG_OPTIONS,
        value: initialIgPreset,
      },
    },
    { collapsed: true, render: () => local }
  );

  // --- scenes for current channel + area ---

  const scenes = useMemo(
    () => registry[mode]?.[area] ?? [],
    [registry, mode, area]
  );

  const sceneOptions = useMemo(
    () => Object.fromEntries(scenes.map((s) => [s.label ?? s.id, s.id])),
    [scenes]
  );

  const sceneDefault = useMemo(() => {
    if (scenes.some((s) => s.id === initialScene)) return initialScene;
    if (scenes.some((s) => s.id === DEFAULT_SCENE)) return DEFAULT_SCENE;
    return scenes[0]?.id ?? 'noScene';
  }, [scenes, initialScene]);

  // Re-evaluates when channel / area change (leva deps array)
  const [{ scene: rawSceneId }, setSceneControl] = useControls(
    'App',
    () => ({
      scene: { options: sceneOptions, value: sceneDefault },
    }),
    { collapsed: true, render: () => local },
    [mode, area]
  );

  // --- guard against stale value after area/channel switch ---

  const sceneMap = useMemo(
    () => Object.fromEntries(scenes.map((s) => [s.id, s])),
    [scenes]
  );

  const sceneId = sceneMap[rawSceneId] ? rawSceneId : sceneDefault;

  useEffect(() => {
    if (!sceneMap[rawSceneId]) {
      setSceneControl({ scene: sceneDefault });
    }
  }, [rawSceneId, sceneMap, sceneDefault, setSceneControl]);

  // --- URL sync ---

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('mode', mode);
    params.set('area', area);
    params.set('scene', sceneId);

    if (ig) {
      params.set(IG_QUERY_PARAM, ig);
    } else {
      params.delete(IG_QUERY_PARAM);
    }

    // remove legacy params
    params.delete('webglShowcaseScene');
    params.delete('webgpuShowcaseScene');
    params.delete('webglTestScene');
    params.delete('webgpuTestScene');
    params.delete('webglWipScene');
    params.delete('webgpuWipScene');
    params.delete('webglToolScene');
    params.delete('webgpuToolScene');

    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [mode, area, sceneId, ig]);

  // --- resolve ---

  const sceneDef = sceneMap[sceneId];
  const SceneComponent = sceneDef?.Component;
  const CanvasWrapper = mode === 'webgpu' ? WebGPUCanvas : WebGLCanvas;

  return {
    local,
    channel: mode,
    area,
    sceneId,
    sceneDef,
    SceneComponent,
    CanvasWrapper,
    renderer: mode,
  };
}
