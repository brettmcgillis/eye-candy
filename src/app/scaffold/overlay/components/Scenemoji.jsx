import { levaStore } from 'leva';

import React from 'react';

import useScenes, { AREA_ICONS } from '../../../useScenes';

const FALLBACK_ICON = '💀';

export default function Scenemoji({ onDebugToggle }) {
  const registry = useScenes();

  const channel =
    levaStore.useStore((state) => state.data?.['Scene Select.mode']?.value) ??
    'webgl';

  const area =
    levaStore.useStore((state) => state.data?.['Scene Select.area']?.value) ??
    'showcase';

  const sceneId = levaStore.useStore(
    (state) => state.data?.['Scene Select.scene']?.value
  );

  const scenes = registry[channel]?.[area] ?? [];
  const scene = scenes.find((s) => s.id === sceneId);
  const sceneIcon = scene?.icon ?? FALLBACK_ICON;
  const areaIcon = AREA_ICONS[area];

  return (
    <>
      <span className="debug" onClick={onDebugToggle}>
        🔥
      </span>
      {areaIcon ? ` — ${areaIcon} — ` : ' — '}
      {sceneIcon}
    </>
  );
}
