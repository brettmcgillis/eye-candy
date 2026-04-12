import { levaStore } from 'leva';

import React from 'react';

import useScenes, { AREA_ICONS } from '../../../useScenes';

const FALLBACK_ICON = '💀';

export default function Scenemoji({ onDebugToggle }) {
  const registry = useScenes();
  const readLevaValue = (state, keys) => {
    const values = keys.map((key) => state.data?.[key]?.value);
    return values.find((value) => value !== undefined);
  };

  const channel =
    levaStore.useStore((state) =>
      readLevaValue(state, ['App.mode', 'Scene Select.mode'])
    ) ?? 'webgl';

  const area =
    levaStore.useStore((state) =>
      readLevaValue(state, ['App.area', 'Scene Select.area'])
    ) ?? 'showcase';

  const sceneId = levaStore.useStore((state) =>
    readLevaValue(state, ['App.scene', 'Scene Select.scene'])
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
