import { levaStore } from 'leva';

import React from 'react';
import { PiSkullDuotone } from 'react-icons/pi';

import useScenes, { AREA_ICONS } from '../../../useScenes';

function FallbackIcon() {
  return <PiSkullDuotone color="#888" />;
}

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
  const SceneIcon = scene?.icon ?? FallbackIcon;
  const AreaIcon = AREA_ICONS[area];

  return (
    <>
      <span className="debug" onClick={onDebugToggle}>
        <img
          src="/images/reversal-inner.png"
          alt="Debug"
          style={{
            width: 'auto',
            height: 'calc(var(--overlay-icon-size) * 1.4)',
            verticalAlign: 'middle',
            objectFit: 'contain',
          }}
        />
      </span>
      {AreaIcon ? (
        <>
          {' '}
          — <AreaIcon /> —{' '}
        </>
      ) : (
        ' — '
      )}
      <SceneIcon />
    </>
  );
}
