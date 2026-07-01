import React, { lazy } from 'react';
import { FaFlask, FaToolbox } from 'react-icons/fa';
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';
import { PiSkullDuotone } from 'react-icons/pi';

const NoScene = lazy(() => import('./scaffold/NoScene'));

function WipAreaIcon() {
  return <HiOutlineWrenchScrewdriver color="#000000" size={24} />;
}

function TestlabAreaIcon() {
  return <FaFlask color="#22c55e" />;
}

function ToolboxAreaIcon() {
  return <FaToolbox color="#dc2626" />;
}

function NoSceneIcon() {
  return <PiSkullDuotone color="#2b2b2b" />;
}

export const AREA_ROUTE_SEGMENTS = {
  showcase: '',
  testlab: 'testlab',
  toolbox: 'toolbox',
  wip: 'wip',
};

const AREA_SEGMENT_TO_KEY = Object.fromEntries(
  Object.entries(AREA_ROUTE_SEGMENTS)
    .filter(([, segment]) => segment)
    .map(([area, segment]) => [segment, area])
);

export const DEFAULT_SCENE_PATH = '/loGlow';

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;

  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

function createRegistryShape(createValue = () => []) {
  return {
    webgl: {
      showcase: createValue(),
      wip: createValue(),
      testlab: createValue(),
      toolbox: createValue(),
    },
    webgpu: {
      showcase: createValue(),
      wip: createValue(),
      testlab: createValue(),
      toolbox: createValue(),
    },
  };
}

function getSceneKey(channel, area, sceneId) {
  return `${channel}:${area}:${sceneId}`;
}

function getScenePath(area, route) {
  const areaSegment = AREA_ROUTE_SEGMENTS[area];
  return areaSegment ? `/${areaSegment}/${route}` : `/${route}`;
}

function pickDefaultScene(scenes) {
  return (
    scenes.find((scene) => scene.id === 'loGlow') ||
    scenes.find((scene) => scene.id !== 'noScene') ||
    scenes[0] ||
    null
  );
}

function buildSceneRegistry(items) {
  const byArea = createRegistryShape();
  const byPath = {};
  const byLegacyId = {};
  const bySceneKey = {};
  const areaDefaults = createRegistryShape(() => null);

  items.forEach((item) => {
    const baseRoute = item.route ?? item.id;
    let route = baseRoute;
    let path = getScenePath(item.area, route);
    let suffixIndex = 2;

    while (byPath[path]) {
      route = `${baseRoute}-${suffixIndex}`;
      path = getScenePath(item.area, route);
      suffixIndex += 1;
    }

    const sceneRecord = {
      ...item,
      name: item.label,
      route,
      path,
    };

    byArea[item.channel][item.area].push(sceneRecord);
    byPath[path] = sceneRecord;
    bySceneKey[getSceneKey(item.channel, item.area, item.id)] = sceneRecord;

    if (!byLegacyId[item.id]) {
      byLegacyId[item.id] = sceneRecord;
    }
  });

  Object.entries(byArea).forEach(([channel, areas]) => {
    Object.entries(areas).forEach(([area, scenes]) => {
      scenes.sort(compareScenes);
      areaDefaults[channel][area] = pickDefaultScene(scenes);
    });
  });

  const defaultScene =
    bySceneKey[getSceneKey('webgl', 'showcase', 'loGlow')] ||
    pickDefaultScene(byArea.webgl.showcase);

  return {
    byArea,
    byPath,
    byLegacyId,
    bySceneKey,
    areaDefaults,
    defaultScene,
  };
}

export const CHANNELS = {
  webgl: 'WebGL',
  webgpu: 'WebGPU',
};

export const AREAS = {
  showcase: 'Showcase',
  wip: 'Work in Progress',
  testlab: 'Test Lab',
  toolbox: 'Toolbox',
};

export const AREA_ICONS = {
  showcase: null,
  wip: WipAreaIcon,
  testlab: TestlabAreaIcon,
  toolbox: ToolboxAreaIcon,
};

// Every scene folder owns a colocated `scene.config.jsx` exporting its own
// registry entry (or an array of entries, for a renderer-agnostic component
// registered under both channels). This glob is the entire "registry" of
// scenes — adding, removing, or moving a scene between areas/channels never
// touches this file, only the scene's own folder. See docs/scene-conventions.md.
const sceneConfigModules = import.meta.glob(
  '../components/scenes/**/scene.config.jsx',
  {
    eager: true,
  }
);

const sceneEntries = Object.values(sceneConfigModules).flatMap((mod) =>
  Array.isArray(mod.default) ? mod.default : [mod.default]
);

const noSceneEntries = Object.keys(CHANNELS).flatMap((channel) =>
  Object.keys(AREAS).map((area) => ({
    id: 'noScene',
    label: 'None',
    channel,
    area,
    route: channel === 'webgl' ? 'noScene' : 'noScene-webgpu',
    icon: NoSceneIcon,
    Component: NoScene,
  }))
);

export const EYE_CANDIES = [...noSceneEntries, ...sceneEntries];

const sceneRegistry = buildSceneRegistry(EYE_CANDIES);

export function getScenesFor(channel, area) {
  return sceneRegistry.byArea[channel]?.[area] ?? [];
}

export function resolveScenePath(path) {
  return sceneRegistry.byPath[path] ?? null;
}

export function resolveLegacyScenePath(sceneId) {
  return sceneRegistry.byLegacyId[sceneId]?.path ?? null;
}

export function normalizeScenePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
}

export function getAreaDefaultPath(area, channel = 'webgl') {
  return (
    sceneRegistry.areaDefaults[channel]?.[area]?.path ||
    sceneRegistry.defaultScene?.path ||
    DEFAULT_SCENE_PATH
  );
}

export function resolveSceneRoute(pathname) {
  const currentPath = normalizeScenePath(pathname);
  const scene = resolveScenePath(currentPath);

  if (scene) {
    return { scene, redirectPath: null };
  }

  const pathSegments = currentPath.split('/').filter(Boolean);

  if (pathSegments.length === 1) {
    return {
      scene: null,
      redirectPath:
        resolveLegacyScenePath(pathSegments[0]) || DEFAULT_SCENE_PATH,
    };
  }

  if (pathSegments.length === 2) {
    const [areaSegment] = pathSegments;
    const area = AREA_SEGMENT_TO_KEY[areaSegment];

    if (area) {
      return {
        scene: null,
        redirectPath: getAreaDefaultPath(area),
      };
    }
  }

  return { scene: null, redirectPath: DEFAULT_SCENE_PATH };
}

export default sceneRegistry;
