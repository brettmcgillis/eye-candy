import React from 'react';
import { PiSkullDuotone } from 'react-icons/pi';
import { useLocation } from 'react-router-dom';

import { iconFile } from '../../../../utils/appUtils';
import sceneRegistry, { AREA_ICONS, resolveScenePath } from '../../../sceneRegistry';

function FallbackIcon() {
  return <PiSkullDuotone color="#888" />;
}

export default function Scenemoji({ onDebugToggle }) {
  const location = useLocation();
  const match = resolveScenePath(location.pathname) ?? sceneRegistry.defaultScene;

  const { channel, area } = match;
  const scenes = sceneRegistry.byArea[channel]?.[area] ?? [];
  const scene = scenes.find((s) => s.id === match.id);
  const SceneIcon = scene?.icon ?? FallbackIcon;
  const AreaIcon = AREA_ICONS[area];

  return (
    <>
      <span className="debug" onClick={onDebugToggle}>
        <img
          src={iconFile('reversal-inner.png')}
          alt="Reversal"
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
